import { test, expect } from '@playwright/test';

test.describe('OAuth Issue Analysis', () => {
  
  test('Debug exact OAuth flow and identify the problem', async ({ page }) => {
    console.log('=== PRECISE OAUTH ISSUE ANALYSIS ===');

    // Track all console messages
    page.on('console', (msg) => {
      console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
    });

    // Track auth-related network requests
    page.on('request', (request) => {
      if (request.url().includes('auth') || request.url().includes('google')) {
        console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('auth') && response.url().includes('localhost:3000')) {
        try {
          const body = await response.text();
          console.log(`[AUTH RESPONSE]: ${response.status()} ${response.url()}`);
          console.log(`[AUTH BODY]:`, body.substring(0, 300));
        } catch (e) {
          console.log(`[AUTH RESPONSE]: ${response.status()} ${response.url()} - Could not read body`);
        }
      }
    });

    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/issue-analysis-1-initial.png', fullPage: true });

    // Check initial state
    const initialState = await page.evaluate(() => ({
      url: window.location.href,
      hasToken: !!localStorage.getItem('token'),
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    }));
    console.log('1. Initial state:', initialState);

    // Set up popup monitoring
    let popupClosed = false;
    let popupUrl = '';
    page.on('popup', async (popup) => {
      popupUrl = popup.url();
      console.log('2. Popup opened:', popupUrl);
      
      popup.on('close', () => {
        popupClosed = true;
        console.log('3. Popup closed');
      });
    });

    // Click Google login
    console.log('4. Clicking Google login button...');
    await page.locator('button:has-text("Continue with Google")').click();
    
    // Wait for popup to appear and close
    await page.waitForTimeout(3000);
    
    // Take screenshot after popup interaction
    await page.screenshot({ path: 'test-results/issue-analysis-2-after-popup.png', fullPage: true });

    // Check state after popup
    const stateAfterPopup = await page.evaluate(() => ({
      url: window.location.href,
      hasToken: !!localStorage.getItem('token'),
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    }));
    console.log('5. State after popup interaction:', stateAfterPopup);
    console.log('6. Popup was closed:', popupClosed);
    console.log('7. Popup final URL:', popupUrl);

    // Check if React state updated
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('8. Final page URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('❌ ISSUE CONFIRMED: Still on login page despite OAuth flow');
      
      // Check what the React component thinks
      const componentState = await page.evaluate(() => {
        // Try to access the button state
        const googleButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
        return {
          buttonDisabled: googleButton?.disabled,
          loadingSpinner: document.querySelector('[role="progressbar"]') !== null,
          alertMessages: Array.from(document.querySelectorAll('[role="alert"]')).map(el => el.textContent),
          pageTitle: document.title
        };
      });
      console.log('9. Component state analysis:', componentState);
    } else {
      console.log('✅ Redirect worked correctly');
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/issue-analysis-3-final.png', fullPage: true });
    
    console.log('=== ANALYSIS COMPLETE ===');
  });

  test('Test manual token injection to verify redirect logic', async ({ page }) => {
    console.log('=== TESTING REDIRECT LOGIC WITH MANUAL TOKEN ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Manually inject token and user data as if OAuth succeeded
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token-12345');
      console.log('Token manually injected');
    });

    // Wait for React to potentially react
    await page.waitForTimeout(1000);

    // Check if redirect happened
    const urlAfterTokenInjection = page.url();
    console.log('URL after manual token injection:', urlAfterTokenInjection);

    if (urlAfterTokenInjection.includes('/login')) {
      console.log('❌ PROBLEM CONFIRMED: Manual token injection did not trigger redirect');
      console.log('This means the issue is in how the AuthContext detects token changes');
    } else {
      console.log('✅ Redirect worked with manual token injection');
    }

    await page.screenshot({ path: 'test-results/manual-token-test.png', fullPage: true });
  });

  test('Check environment and configuration', async ({ page }) => {
    console.log('=== CONFIGURATION CHECK ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const config = await page.evaluate(() => ({
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE
    }));
    
    console.log('Environment configuration:', config);

    // Test if backend is accessible
    const backendTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/me');
        return {
          reachable: true,
          status: response.status,
          accessible: response.status !== 0
        };
      } catch (error) {
        return {
          reachable: false,
          error: error.message
        };
      }
    });
    
    console.log('Backend accessibility:', backendTest);

    // Check if the configured API URL is being used
    const configuredBackendTest = await page.evaluate(async () => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      try {
        const response = await fetch(`${apiUrl}/auth/me`);
        return {
          reachable: true,
          status: response.status,
          url: apiUrl
        };
      } catch (error) {
        return {
          reachable: false,
          error: error.message,
          url: apiUrl
        };
      }
    });
    
    console.log('Configured backend test:', configuredBackendTest);
  });
});