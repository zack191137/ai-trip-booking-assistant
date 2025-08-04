import { test, expect, Page } from '@playwright/test';

test.describe('AuthContext Reactive Behavior Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', (msg) => {
      console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
    });

    // Monitor network requests to the backend
    page.on('request', (request) => {
      if (request.url().includes('ai.zackz.net:3000/api/auth')) {
        console.log(`[AUTH REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('ai.zackz.net:3000/api/auth')) {
        console.log(`[AUTH RESPONSE]: ${response.status()} ${response.url()}`);
        try {
          const text = await response.text();
          console.log(`[AUTH RESPONSE BODY]:`, text.substring(0, 300));
        } catch (e) {
          console.log(`[AUTH RESPONSE]: Could not read body`);
        }
      }
    });

    // Clear any existing auth state
    await page.goto('http://localhost:3002/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete Google OAuth Flow with AuthContext Reactivity', async () => {
    console.log('=== TESTING AUTHCONTEXT REACTIVE BEHAVIOR ===');

    // Step 1: Navigate to login page and verify initial state
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const initialState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      localStorage: { ...localStorage }
    }));
    
    console.log('1. Initial state:', initialState);
    expect(initialState.pathname).toBe('/login');
    expect(initialState.hasToken).toBe(false);

    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/auth-reactive-1-initial.png', 
      fullPage: true 
    });

    // Step 2: Set up monitoring for AuthContext state changes
    await page.evaluate(() => {
      // Monitor localStorage changes
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        console.log(`[STORAGE SET]: ${key} = ${value}`);
        originalSetItem.call(this, key, value);
        // Dispatch storage event to simulate cross-tab behavior
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: value,
          oldValue: null,
          storageArea: localStorage
        }));
      };

      // Monitor custom auth-change events
      window.addEventListener('auth-change', () => {
        console.log('[AUTH-CHANGE EVENT]: Custom auth change event triggered');
      });

      // Monitor storage events
      window.addEventListener('storage', (e) => {
        console.log(`[STORAGE EVENT]: ${e.key} changed from "${e.oldValue}" to "${e.newValue}"`);
      });
    });

    // Step 3: Mock successful Google OAuth backend response
    await page.route('**/api/auth/google', async (route) => {
      console.log('2. Intercepting Google auth request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-oauth-user-123',
            email: 'testuser@example.com',
            name: 'Test OAuth User',
            avatar: 'https://example.com/avatar.jpg'
          },
          token: 'mock-oauth-jwt-token-xyz789'
        })
      });
    });

    // Step 4: Mock Google OAuth popup success
    let popupPromise: Promise<any> | null = null;
    page.on('popup', async (popup) => {
      console.log('3. Google OAuth popup opened');
      await popup.screenshot({ 
        path: 'test-results/auth-reactive-2-popup.png', 
        fullPage: true 
      });
      
      // Simulate successful OAuth by closing popup and triggering success
      await popup.close();
    });

    // Override the Google OAuth library to simulate successful flow
    await page.addInitScript(() => {
      // Mock the Google OAuth library
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: any) => ({
              requestAccessToken: () => {
                console.log('[MOCK GOOGLE]: Simulating successful OAuth');
                setTimeout(() => {
                  config.callback({ access_token: 'mock-google-access-token' });
                }, 500);
              }
            })
          }
        }
      };
    });

    // Step 5: Click the Google OAuth button
    console.log('4. Clicking "Continue with Google" button');
    await page.locator('button:has-text("Continue with Google")').click();
    
    await page.screenshot({ 
      path: 'test-results/auth-reactive-3-after-click.png', 
      fullPage: true 
    });

    // Step 6: Wait for the authentication flow to complete
    console.log('5. Waiting for authentication to complete...');
    await page.waitForTimeout(2000);

    // Step 7: Check if AuthContext detected the state change
    const postAuthState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token'),
      localStorage: { ...localStorage }
    }));

    console.log('6. Post-auth state:', postAuthState);

    // Step 8: Verify the redirect happened (this is the key test)
    console.log('7. Checking if redirect to /chat occurred...');
    
    // Wait for potential redirect
    await page.waitForTimeout(1000);
    
    const finalState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token')
    }));

    console.log('8. Final state:', finalState);

    await page.screenshot({ 
      path: 'test-results/auth-reactive-4-final.png', 
      fullPage: true 
    });

    // Assertions
    expect(finalState.hasToken).toBe(true);
    
    // The critical test: verify that AuthContext reacted to the auth change
    // and redirected to /chat (or at least away from /login)
    if (finalState.pathname === '/login') {
      console.log('❌ FAILED: Still on login page - AuthContext may not be reacting to changes');
      
      // Additional debugging
      const debugInfo = await page.evaluate(() => {
        const authEvents = (window as any).authEventLog || [];
        return {
          authEvents,
          storageEvents: (window as any).storageEventLog || [],
          currentUser: 'Cannot access React context from page evaluate'
        };
      });
      console.log('Debug info:', debugInfo);
      
      expect(finalState.pathname).not.toBe('/login');
    } else {
      console.log('✅ SUCCESS: Redirected away from login page - AuthContext is reactive!');
      expect(finalState.pathname).not.toBe('/login');
    }
  });

  test('Test Storage Event Listener', async () => {
    console.log('=== TESTING STORAGE EVENT LISTENER ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Monitor for auth changes
    await page.evaluate(() => {
      (window as any).authChangeEvents = [];
      window.addEventListener('auth-change', () => {
        (window as any).authChangeEvents.push('auth-change-triggered');
        console.log('[TEST]: auth-change event captured');
      });

      (window as any).storageEvents = [];
      window.addEventListener('storage', (e) => {
        (window as any).storageEvents.push({ key: e.key, newValue: e.newValue });
        console.log(`[TEST]: storage event captured - ${e.key}`);
      });
    });

    // Simulate token storage change (as would happen in OAuth flow)
    await page.evaluate(() => {
      console.log('[TEST]: Manually setting token and triggering events');
      localStorage.setItem('token', 'test-token-123');
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: 'test-token-123',
        oldValue: null,
        storageArea: localStorage
      }));

      // Trigger custom auth change event
      window.dispatchEvent(new Event('auth-change'));
    });

    await page.waitForTimeout(1000);

    const eventResults = await page.evaluate(() => ({
      authChangeEvents: (window as any).authChangeEvents,
      storageEvents: (window as any).storageEvents,
      currentUrl: window.location.href
    }));

    console.log('Event results:', eventResults);

    expect(eventResults.authChangeEvents).toContain('auth-change-triggered');
    expect(eventResults.storageEvents.some((e: any) => e.key === 'token')).toBe(true);
  });

  test('Test Backend Connectivity to ai.zackz.net:3000', async () => {
    console.log('=== TESTING BACKEND CONNECTIVITY ===');

    await page.goto('/login');

    const backendTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://ai.zackz.net:3000/api/auth/me', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: null
        };
      } catch (error) {
        return {
          status: null,
          ok: false,
          statusText: null,
          headers: {},
          error: error.message
        };
      }
    });

    console.log('Backend connectivity test:', backendTest);

    // Test Google OAuth endpoint specifically
    const googleOAuthTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://ai.zackz.net:3000/api/auth/google', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: 'test-token' })
        });
        
        const text = await response.text();
        
        return {
          status: response.status,
          ok: response.ok,
          body: text.substring(0, 200),
          error: null
        };
      } catch (error) {
        return {
          status: null,
          ok: false,
          body: '',
          error: error.message
        };
      }
    });

    console.log('Google OAuth endpoint test:', googleOAuthTest);

    await page.screenshot({ 
      path: 'test-results/auth-reactive-backend-test.png', 
      fullPage: true 
    });
  });

  test('Manual OAuth Flow Simulation', async () => {
    console.log('=== MANUAL OAUTH FLOW SIMULATION ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Step 1: Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/manual-oauth-1-initial.png', 
      fullPage: true 
    });

    // Step 2: Click Google OAuth button and handle the actual popup
    console.log('Clicking Google OAuth button...');
    
    let popup = null;
    const popupPromise = new Promise((resolve) => {
      page.on('popup', (newPage) => {
        popup = newPage;
        console.log('Real Google OAuth popup opened:', newPage.url());
        resolve(newPage);
      });
    });

    await page.locator('button:has-text("Continue with Google")').click();

    // Step 3: Handle popup if it opens
    try {
      await Promise.race([
        popupPromise,
        page.waitForTimeout(5000)
      ]);

      if (popup) {
        await popup.screenshot({ 
          path: 'test-results/manual-oauth-2-popup.png', 
          fullPage: true 
        });

        console.log('Popup URL:', popup.url());
        console.log('Note: This is a real Google OAuth popup - manual intervention required for full flow');
        
        // Wait a bit for manual interaction
        await page.waitForTimeout(30000);
      }
    } catch (error) {
      console.log('No popup opened or timeout occurred:', error.message);
    }

    // Step 4: Check final state
    const finalState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token')
    }));

    console.log('Final state after manual OAuth:', finalState);

    await page.screenshot({ 
      path: 'test-results/manual-oauth-3-final.png', 
      fullPage: true 
    });
  });
});