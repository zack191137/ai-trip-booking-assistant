import { test, expect } from '@playwright/test';

test.describe('AuthContext Debug - Focused Testing', () => {
  
  test('Debug AuthContext Reactive Behavior Step by Step', async ({ page }) => {
    console.log('=== FOCUSED AUTHCONTEXT DEBUG ===');

    // Enable detailed console logging
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Monitor network requests
    page.on('request', (request) => {
      if (request.url().includes('auth') || request.url().includes('google')) {
        console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('auth') || response.url().includes('google')) {
        console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log('1. ✅ Navigated to login page');
    await page.screenshot({ path: 'test-results/debug-step1-login.png', fullPage: true });

    // Step 2: Check initial state
    const initialState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    }));
    
    console.log('2. Initial state:', initialState);
    expect(initialState.pathname).toBe('/login');
    expect(initialState.hasToken).toBe(false);

    // Step 3: Mock successful backend response
    await page.route('**/api/auth/google', async (route) => {
      console.log('3. ✅ Mocking successful Google auth response');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'debug-user-123',
            email: 'debug@example.com',
            name: 'Debug User',
            avatar: null
          },
          token: 'debug-jwt-token-abc123'
        })
      });
    });

    // Step 4: Set up event monitoring
    await page.evaluate(() => {
      // Create event tracking
      (window as any).eventLog = [];

      // Override localStorage.setItem to track token changes
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key: string, value: string) {
        (window as any).eventLog.push(`localStorage.setItem: ${key} = ${value}`);
        console.log(`[STORAGE SET]: ${key} = ${value}`);
        originalSetItem.call(this, key, value);
        
        // Manually trigger storage event since it doesn't fire for same-window changes
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: value,
          oldValue: null,
          storageArea: localStorage
        }));
      };

      // Monitor auth-change events
      window.addEventListener('auth-change', () => {
        (window as any).eventLog.push('auth-change event triggered');
        console.log('[EVENT]: auth-change triggered');
      });

      // Monitor storage events
      window.addEventListener('storage', (e) => {
        (window as any).eventLog.push(`storage event: ${e.key} changed`);
        console.log(`[EVENT]: storage event - ${e.key} changed`);
      });

      console.log('[SETUP]: Event monitoring configured');
    });

    // Step 5: Mock Google OAuth library to simulate successful flow
    await page.addInitScript(() => {
      // Mock Google OAuth
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: any) => ({
              requestAccessToken: () => {
                console.log('[MOCK]: Simulating Google OAuth success');
                setTimeout(() => {
                  config.callback({ access_token: 'mock-google-token-xyz' });
                }, 100);
              }
            })
          }
        }
      };
    });

    // Step 6: Click the Google button
    console.log('4. 🔄 Clicking Continue with Google button...');
    await page.locator('button:has-text("Continue with Google")').click();
    
    await page.screenshot({ path: 'test-results/debug-step2-after-click.png', fullPage: true });

    // Step 7: Wait for auth flow to complete
    console.log('5. ⏳ Waiting for authentication flow...');
    await page.waitForTimeout(3000);

    // Step 8: Check what events were triggered
    const eventLog = await page.evaluate(() => (window as any).eventLog || []);
    console.log('6. Event log:', eventLog);

    // Step 9: Check post-auth state
    const postAuthState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token'),
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    }));

    console.log('7. Post-auth state:', postAuthState);

    // Step 10: Wait a bit more for potential redirect
    console.log('8. ⏳ Waiting for potential redirect...');
    await page.waitForTimeout(2000);

    const finalState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token')
    }));

    console.log('9. Final state:', finalState);
    await page.screenshot({ path: 'test-results/debug-step3-final.png', fullPage: true });

    // Step 11: Analysis
    if (finalState.pathname === '/login') {
      console.log('❌ ISSUE: Still on login page after successful auth');
      console.log('   This indicates AuthContext is not reacting to authentication changes');
      
      // Check if we can see any React component state
      const debugInfo = await page.evaluate(() => {
        const authButton = document.querySelector('button:has-text("Continue with Google")');
        return {
          buttonDisabled: authButton?.hasAttribute('disabled'),
          buttonText: authButton?.textContent,
          hasAuthContextProvider: !!document.querySelector('[data-testid="auth-provider"]'),
          reactVersion: (window as any).React ? 'React loaded' : 'React not detected'
        };
      });
      console.log('   Debug info:', debugInfo);
    } else {
      console.log('✅ SUCCESS: Redirected to', finalState.pathname);
    }

    // Assertions
    expect(postAuthState.hasToken).toBe(true);
    expect(eventLog.length).toBeGreaterThan(0);
  });

  test('Test Backend Connectivity to ai.zackz.net:3000', async ({ page }) => {
    console.log('=== TESTING BACKEND CONNECTIVITY ===');

    await page.goto('/login');

    // Test /api/auth/me endpoint
    const authMeTest = await page.evaluate(async () => {
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
          error: null
        };
      } catch (error) {
        return {
          status: null,
          ok: false,
          statusText: null,
          error: error.message
        };
      }
    });

    console.log('1. /api/auth/me test:', authMeTest);

    // Test /api/auth/google endpoint
    const googleAuthTest = await page.evaluate(async () => {
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

    console.log('2. /api/auth/google test:', googleAuthTest);

    // Check environment variables
    const envCheck = await page.evaluate(() => ({
      VITE_API_BASE_URL: (import.meta as any).env.VITE_API_BASE_URL,
      VITE_GOOGLE_CLIENT_ID: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID,
      NODE_ENV: (import.meta as any).env.NODE_ENV,
      MODE: (import.meta as any).env.MODE
    }));

    console.log('3. Environment check:', envCheck);

    await page.screenshot({ path: 'test-results/debug-backend-connectivity.png', fullPage: true });
  });

  test('Manual Token Storage Test', async ({ page }) => {
    console.log('=== MANUAL TOKEN STORAGE TEST ===');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    console.log('1. ✅ On login page');

    // Manually set token and trigger events
    const result = await page.evaluate(async () => {
      console.log('[TEST]: Setting token manually...');
      
      // Set the token
      localStorage.setItem('token', 'manual-test-token-123');
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: 'manual-test-token-123',
        oldValue: null,
        storageArea: localStorage
      }));

      // Trigger auth-change event
      window.dispatchEvent(new Event('auth-change'));

      console.log('[TEST]: Events triggered, waiting...');
      
      // Wait a bit for React to respond
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        hasToken: !!localStorage.getItem('token'),
        token: localStorage.getItem('token')
      };
    });

    console.log('2. Result after manual token set:', result);

    await page.waitForTimeout(2000);

    const finalCheck = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token')
    }));

    console.log('3. Final check:', finalCheck);

    await page.screenshot({ path: 'test-results/debug-manual-token.png', fullPage: true });

    if (finalCheck.pathname === '/login') {
      console.log('❌ AuthContext not responding to manual token storage');
    } else {
      console.log('✅ AuthContext successfully responded to token change');
    }
  });
});