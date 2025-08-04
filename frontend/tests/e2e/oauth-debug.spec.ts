import { test, expect, Page } from '@playwright/test';

test.describe('Google OAuth Debug Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
    });

    // Log network requests
    page.on('request', (request) => {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    });

    // Log network responses
    page.on('response', (response) => {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    });

    // Log errors
    page.on('pageerror', (error) => {
      console.error(`[PAGE ERROR]:`, error.message);
    });
  });

  test('Debug OAuth login flow step-by-step', async () => {
    console.log('=== STARTING OAUTH DEBUG TEST ===');

    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/step1-login-page.png', fullPage: true });
    
    // Check initial state
    console.log('Step 1: Checking initial page state...');
    await expect(page.locator('h1')).toContainText('Welcome Back');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();

    // Step 2: Check AuthContext initial state
    console.log('Step 2: Checking initial auth state...');
    const initialAuthState = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        isAuthenticated: localStorage.getItem('token') !== null,
        currentURL: window.location.href
      };
    });
    console.log('Initial auth state:', initialAuthState);

    // Step 3: Click Google login button and monitor changes
    console.log('Step 3: Clicking Google login button...');
    
    // Set up listeners for popup and authentication state changes
    const popupPromise = page.waitForEvent('popup');
    
    // Monitor local storage changes
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        console.log(`[STORAGE SET]: ${key} = ${value}`);
        originalSetItem.call(this, key, value);
      };
    });

    // Click the Google login button
    await page.locator('button:has-text("Continue with Google")').click();
    await page.screenshot({ path: 'test-results/step3-after-google-click.png', fullPage: true });

    try {
      // Step 4: Handle popup (if it appears)
      console.log('Step 4: Waiting for popup...');
      const popup = await popupPromise.catch(() => null);
      
      if (popup) {
        console.log('Popup detected:', popup.url());
        await popup.screenshot({ path: 'test-results/step4-google-popup.png', fullPage: true });
        
        // Wait for popup to complete or close
        await popup.waitForEvent('close').catch(() => {
          console.log('Popup did not close naturally');
        });
      } else {
        console.log('No popup detected, checking for redirect...');
      }

      // Step 5: Monitor authentication state changes
      console.log('Step 5: Monitoring auth state changes...');
      
      // Wait for potential auth state updates (give it time)
      await page.waitForTimeout(3000);
      
      const authStateAfterClick = await page.evaluate(() => {
        return {
          localStorage: { ...localStorage },
          isAuthenticated: localStorage.getItem('token') !== null,
          currentURL: window.location.href,
          documentTitle: document.title,
          bodyClass: document.body.className
        };
      });
      console.log('Auth state after Google click:', authStateAfterClick);

      // Step 6: Check for any auth context updates
      console.log('Step 6: Checking React auth context state...');
      
      // Try to access React component state through data attributes or global variables
      const reactState = await page.evaluate(() => {
        // Look for any global state or data attributes
        const authButton = document.querySelector('button:has-text("Continue with Google")');
        return {
          buttonDisabled: authButton?.hasAttribute('disabled'),
          loadingSpinner: document.querySelector('[role="progressbar"]') !== null,
          currentPath: window.location.pathname,
          hasToken: !!localStorage.getItem('token')
        };
      });
      console.log('React component state:', reactState);

      // Step 7: Take screenshot of current state
      await page.screenshot({ path: 'test-results/step7-after-auth-attempt.png', fullPage: true });

      // Step 8: Check for any network requests to auth endpoints
      console.log('Step 8: Monitoring for auth-related network activity...');
      
      // Listen for specific auth requests
      const authRequests = [];
      page.on('response', (response) => {
        if (response.url().includes('/auth/') || response.url().includes('google')) {
          authRequests.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
          });
        }
      });

      // Wait a bit more for potential async operations
      await page.waitForTimeout(2000);
      console.log('Auth requests captured:', authRequests);

      // Step 9: Check if redirect happened
      console.log('Step 9: Checking for redirect...');
      const finalURL = page.url();
      console.log('Final URL:', finalURL);
      
      if (finalURL.includes('/chat')) {
        console.log('✅ Redirect to /chat successful!');
      } else if (finalURL.includes('/login')) {
        console.log('❌ Still on login page - redirect failed');
        
        // Debug why redirect didn't happen
        const debugInfo = await page.evaluate(() => {
          return {
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            currentURL: window.location.href,
            userAgent: navigator.userAgent,
            cookies: document.cookie
          };
        });
        console.log('Debug info for failed redirect:', debugInfo);
      }

    } catch (error) {
      console.error('Error during OAuth flow:', error);
      await page.screenshot({ path: 'test-results/oauth-error.png', fullPage: true });
      throw error;
    }

    // Step 10: Final comprehensive state check
    console.log('Step 10: Final state analysis...');
    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>),
        hasAuthToken: !!localStorage.getItem('token'),
        pageTitle: document.title,
        visibleText: document.body.innerText.substring(0, 500),
        errorMessages: Array.from(document.querySelectorAll('[role="alert"], .error, .MuiAlert-root'))
          .map(el => el.textContent),
      };
    });
    
    console.log('=== FINAL STATE ANALYSIS ===');
    console.log(JSON.stringify(finalState, null, 2));
    
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
  });

  test('Mock successful Google OAuth response', async () => {
    console.log('=== TESTING WITH MOCKED OAUTH RESPONSE ===');

    // Mock the Google OAuth API
    await page.route('**/api/auth/google', async (route) => {
      console.log('Intercepting Google auth request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            avatar: null
          },
          token: 'mock-jwt-token-12345'
        })
      });
    });

    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Simulate successful Google OAuth flow
    await page.evaluate(() => {
      // Simulate the Google OAuth response
      const mockTokenResponse = { access_token: 'mock-google-token' };
      
      // Trigger the auth flow programmatically
      window.dispatchEvent(new CustomEvent('google-oauth-success', { 
        detail: mockTokenResponse 
      }));
    });

    // Click Google login button
    await page.locator('button:has-text("Continue with Google")').click();
    
    // Wait for potential redirect
    await page.waitForTimeout(3000);
    
    const finalURL = page.url();
    console.log('Final URL after mock OAuth:', finalURL);
    
    if (finalURL.includes('/chat')) {
      console.log('✅ Mock OAuth redirect successful!');
    } else {
      console.log('❌ Mock OAuth redirect failed');
      const state = await page.evaluate(() => ({
        url: window.location.href,
        localStorage: { ...localStorage },
        errors: Array.from(document.querySelectorAll('[role="alert"]')).map(el => el.textContent)
      }));
      console.log('Mock OAuth final state:', state);
    }

    await page.screenshot({ path: 'test-results/mock-oauth-final.png', fullPage: true });
  });

  test('Check backend connectivity', async () => {
    console.log('=== CHECKING BACKEND CONNECTIVITY ===');
    
    await page.goto('/login');
    
    // Test direct API calls
    const apiTests = await page.evaluate(async () => {
      const results = [];
      
      // Test base API URL
      try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        results.push({
          endpoint: '/auth/me',
          status: response.status,
          ok: response.ok,
          error: null
        });
      } catch (error) {
        results.push({
          endpoint: '/auth/me',
          status: null,
          ok: false,
          error: error.message
        });
      }

      // Test Google auth endpoint
      try {
        const response = await fetch('http://localhost:3000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: 'test-token' })
        });
        results.push({
          endpoint: '/auth/google',
          status: response.status,
          ok: response.ok,
          error: null
        });
      } catch (error) {
        results.push({
          endpoint: '/auth/google',
          status: null,
          ok: false,
          error: error.message
        });
      }

      return results;
    });

    console.log('API connectivity tests:', apiTests);

    // Check environment variables
    const envCheck = await page.evaluate(() => {
      return {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      };
    });

    console.log('Environment variables:', envCheck);
  });
});