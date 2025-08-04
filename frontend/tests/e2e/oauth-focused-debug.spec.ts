import { test, expect, Page } from '@playwright/test';

test.describe('Focused OAuth Debug', () => {
  
  test('Analyze OAuth flow with manual intervention', async ({ page }) => {
    console.log('=== FOCUSED OAUTH ANALYSIS ===');

    // Enable detailed logging
    page.on('console', (msg) => {
      console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
    });

    page.on('request', (request) => {
      if (request.url().includes('auth') || request.url().includes('google')) {
        console.log(`[AUTH REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('auth') || response.url().includes('google')) {
        console.log(`[AUTH RESPONSE]: ${response.status()} ${response.url()}`);
        try {
          const body = await response.text();
          console.log(`[AUTH RESPONSE BODY]:`, body.substring(0, 500));
        } catch (e) {
          console.log(`[AUTH RESPONSE]: Could not read body`);
        }
      }
    });

    // Step 1: Navigate and check initial state
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const initialState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasToken: !!localStorage.getItem('token'),
        googAuthScript: !!document.querySelector('script[src*="accounts.google.com"]'),
        reactOAuthLib: typeof window.google !== 'undefined'
      };
    });
    console.log('Initial state:', initialState);

    await page.screenshot({ path: 'test-results/focused-step1-initial.png', fullPage: true });

    // Step 2: Click Google login and immediately check what happens
    console.log('Clicking Google OAuth button...');
    
    // Set up popup handler
    let popup = null;
    page.on('popup', async (newPage) => {
      popup = newPage;
      console.log('Popup opened:', newPage.url());
      
      // Take screenshot of popup
      await newPage.screenshot({ path: 'test-results/focused-popup.png', fullPage: true });
      
      // Monitor popup events
      newPage.on('load', () => console.log('Popup loaded:', newPage.url()));
      newPage.on('close', () => console.log('Popup closed'));
    });

    await page.locator('button:has-text("Continue with Google")').click();
    await page.screenshot({ path: 'test-results/focused-step2-after-click.png', fullPage: true });

    // Step 3: Wait a short time and check state
    await page.waitForTimeout(2000);
    
    const stateAfterClick = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasToken: !!localStorage.getItem('token'),
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>),
        errors: Array.from(document.querySelectorAll('[role="alert"]')).map(el => el.textContent),
        buttonState: {
          disabled: document.querySelector('button:has-text("Continue with Google")')?.hasAttribute('disabled'),
          text: document.querySelector('button:has-text("Continue with Google")')?.textContent
        }
      };
    });
    console.log('State after Google click:', stateAfterClick);

    // Step 4: Check if popup is still open and what's in it
    if (popup && !popup.isClosed()) {
      console.log('Popup is still open at:', popup.url());
      const popupContent = await popup.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 300),
          hasGoogleForm: !!document.querySelector('form'),
          hasEmailInput: !!document.querySelector('input[type="email"]')
        };
      });
      console.log('Popup content:', popupContent);
    }

    // Step 5: Check if backend is accessible
    console.log('Testing backend connectivity...');
    const backendTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
          method: 'GET',
        });
        return {
          status: response.status,
          ok: response.ok,
          error: null
        };
      } catch (error) {
        return {
          status: null,
          ok: false,
          error: error.message
        };
      }
    });
    console.log('Backend connectivity:', backendTest);

    // Step 6: Check Google OAuth configuration
    const googleConfig = await page.evaluate(() => {
      return {
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        mode: import.meta.env.MODE,
        nodeEnv: import.meta.env.NODE_ENV
      };
    });
    console.log('Environment config:', googleConfig);

    await page.screenshot({ path: 'test-results/focused-final.png', fullPage: true });
    
    console.log('=== ANALYSIS COMPLETE ===');
  });

  test('Simulate successful OAuth flow with mocked backend', async ({ page }) => {
    console.log('=== SIMULATING SUCCESSFUL OAUTH ===');

    // Mock the backend auth endpoint
    await page.route('**/api/auth/google', async (route) => {
      console.log('Mocking successful Google auth response');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            avatar: null
          },
          token: 'mock-jwt-token-abcdef123456'
        })
      });
    });

    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check initial auth state
    const initialAuth = await page.evaluate(() => ({
      isAuthenticated: !!localStorage.getItem('token')
    }));
    console.log('Initial auth state:', initialAuth);

    // Simulate Google OAuth success by directly calling the auth service
    await page.evaluate(async () => {
      // Import auth service and simulate successful login
      try {
        // Directly set token to simulate successful auth
        localStorage.setItem('token', 'mock-jwt-token-abcdef123456');
        
        // Trigger a storage event to notify other parts of the app
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          newValue: 'mock-jwt-token-abcdef123456',
          storageArea: localStorage
        }));
        
        console.log('Simulated successful token storage');
      } catch (error) {
        console.error('Error simulating auth:', error);
      }
    });

    // Wait for React to react to the auth state change
    await page.waitForTimeout(1000);

    // Check if redirect happened
    const finalUrl = page.url();
    console.log('Final URL after simulated auth:', finalUrl);

    // Check auth state
    const finalAuth = await page.evaluate(() => ({
      url: window.location.href,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token')
    }));
    console.log('Final auth state:', finalAuth);

    await page.screenshot({ path: 'test-results/mock-success-final.png', fullPage: true });

    // If still on login page, check why
    if (finalUrl.includes('/login')) {
      console.log('Still on login page after successful auth - investigating...');
      
      const investigation = await page.evaluate(() => {
        return {
          currentPath: window.location.pathname,
          reactRouterLocation: window.history.state,
          authContextState: 'Unable to access directly',
          visibleElements: Array.from(document.querySelectorAll('button, input, [role="alert"]'))
            .map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 50), disabled: el.hasAttribute('disabled') }))
        };
      });
      console.log('Investigation results:', investigation);
    }
  });

  test('Check React OAuth Google library integration', async ({ page }) => {
    console.log('=== CHECKING REACT OAUTH INTEGRATION ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if Google OAuth library is loaded
    const googleOAuthStatus = await page.evaluate(() => {
      return {
        googleScriptLoaded: !!document.querySelector('script[src*="accounts.google.com"]'),
        googleGlobalAvailable: typeof window.google !== 'undefined',
        googleAccountsAvailable: typeof window.google?.accounts !== 'undefined',
        reactOAuthContext: 'Cannot access directly from page context'
      };
    });
    console.log('Google OAuth library status:', googleOAuthStatus);

    // Check if clicking the button triggers the right events
    page.on('console', (msg) => {
      if (msg.text().includes('Google') || msg.text().includes('OAuth') || msg.text().includes('login')) {
        console.log(`[OAUTH CONSOLE]:`, msg.text());
      }
    });

    await page.locator('button:has-text("Continue with Google")').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/oauth-integration-check.png', fullPage: true });
  });
});