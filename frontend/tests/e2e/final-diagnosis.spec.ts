import { test, expect } from '@playwright/test';

test.describe('Final OAuth Diagnosis', () => {
  
  test('Complete OAuth Flow Analysis with Real Google Auth', async ({ page }) => {
    console.log('=== FINAL OAUTH DIAGNOSIS ===');

    // Enable detailed logging
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Monitor all network requests
    page.on('request', (request) => {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    });

    page.on('response', async (response) => {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    });

    // Step 1: Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log('1. ✅ On login page');
    await page.screenshot({ path: 'test-results/final-step1-login.png', fullPage: true });

    // Step 2: Check AuthContext initial state
    const initialAuth = await page.evaluate(() => {
      // Try to access the AuthContext directly from the page
      const authButton = document.querySelector('button[disabled]');
      return {
        url: window.location.href,
        hasToken: !!localStorage.getItem('token'),
        hasDisabledButton: !!authButton,
        buttonText: document.querySelector('button:contains("Continue with Google")')?.textContent || 'Button not found'
      };
    });

    console.log('2. Initial auth state:', initialAuth);

    // Step 3: Set up comprehensive monitoring
    await page.evaluate(() => {
      // Track all events and state changes
      (window as any).diagnosisLog = [];
      
      // Log function
      const log = (message: string) => {
        (window as any).diagnosisLog.push(`${Date.now()}: ${message}`);
        console.log(`[DIAGNOSIS]: ${message}`);
      };

      // Monitor localStorage changes
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key: string, value: string) {
        log(`localStorage.setItem: ${key} = ${value.substring(0, 20)}...`);
        originalSetItem.call(this, key, value);
        
        // Trigger storage event
        const event = new StorageEvent('storage', {
          key,
          newValue: value,
          oldValue: null,
          storageArea: localStorage
        });
        window.dispatchEvent(event);
        log(`Dispatched storage event for key: ${key}`);
      };

      // Monitor all events that AuthContext listens to
      window.addEventListener('storage', (e) => {
        log(`Storage event received: ${e.key} = ${e.newValue?.substring(0, 20)}...`);
      });

      window.addEventListener('auth-change', () => {
        log('Auth-change event received');
      });

      // Monitor React state changes by watching the DOM
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/login') {
              log(`DOM change detected, current path: ${currentPath}`);
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      log('Monitoring setup complete');
    });

    // Step 4: Test real Google OAuth button click
    console.log('3. 🔄 Clicking real Google OAuth button...');
    
    let popup = null;
    const popupPromise = new Promise((resolve) => {
      page.on('popup', (newPage) => {
        popup = newPage;
        console.log('4. ✅ Google OAuth popup opened:', newPage.url());
        resolve(newPage);
      });
    });

    // Click the button
    await page.locator('button:has-text("Continue with Google")').click();
    await page.screenshot({ path: 'test-results/final-step2-clicked.png', fullPage: true });

    // Wait for popup or timeout
    try {
      await Promise.race([
        popupPromise,
        page.waitForTimeout(5000)
      ]);

      if (popup) {
        console.log('5. 📸 Taking popup screenshot...');
        await popup.screenshot({ path: 'test-results/final-step3-popup.png', fullPage: true });
        
        console.log('6. ⏳ Waiting for popup interaction (manual step)...');
        console.log('   NOTE: This requires manual Google account selection in the popup');
        
        // Wait for popup to close (indicating user completed OAuth)
        try {
          await popup.waitForEvent('close', { timeout: 60000 });
          console.log('7. ✅ Popup closed - OAuth flow completed');
        } catch {
          console.log('7. ⏰ Popup still open after timeout');
        }
      } else {
        console.log('5. ❌ No popup opened - checking what happened...');
      }
    } catch (error) {
      console.log('5. ❌ Error during popup handling:', error.message);
    }

    // Step 5: Check what happened after OAuth attempt
    await page.waitForTimeout(2000);

    const diagnosisLog = await page.evaluate(() => (window as any).diagnosisLog || []);
    console.log('8. 📋 Diagnosis log:', diagnosisLog);

    const finalState = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token'),
      token: localStorage.getItem('token')?.substring(0, 20) + '...',
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key)?.substring(0, 20) + '...';
        return acc;
      }, {} as Record<string, string>)
    }));

    console.log('9. 📊 Final state:', finalState);
    await page.screenshot({ path: 'test-results/final-step4-final.png', fullPage: true });

    // Step 6: Analysis and conclusion
    if (finalState.pathname === '/login' && finalState.hasToken) {
      console.log('🔍 DIAGNOSIS: Token exists but no redirect occurred');
      console.log('   This confirms AuthContext is not reacting to storage changes');
      console.log('   The fix is working for token storage but not for state updates');
    } else if (finalState.pathname !== '/login') {
      console.log('✅ SUCCESS: OAuth flow worked correctly!');
      console.log('   User was redirected to:', finalState.pathname);
    } else {
      console.log('❌ ISSUE: OAuth flow did not complete successfully');
      console.log('   No token was stored, indicating backend or OAuth library issue');
    }

    // Generate final report
    const report = {
      testCompleted: new Date().toISOString(),
      initialState: initialAuth,
      finalState,
      diagnosisLog,
      popupOpened: !!popup,
      conclusion: finalState.pathname === '/login' && finalState.hasToken 
        ? 'AuthContext not reactive to storage changes' 
        : finalState.pathname !== '/login' 
          ? 'OAuth flow successful'
          : 'OAuth flow failed to complete'
    };

    console.log('📋 FINAL REPORT:', JSON.stringify(report, null, 2));
  });

  test('Backend Connectivity Check', async ({ page }) => {
    console.log('=== BACKEND CONNECTIVITY CHECK ===');

    await page.goto('/login');

    // Test different backend URLs
    const tests = [
      'https://ai.zackz.net:3000/api/auth/me',
      'http://ai.zackz.net:3000/api/auth/me',
      'https://ai.zackz.net:3000/api/auth/google'
    ];

    for (const url of tests) {
      const result = await page.evaluate(async (testUrl) => {
        try {
          const response = await fetch(testUrl, {
            method: testUrl.includes('google') ? 'POST' : 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: testUrl.includes('google') ? JSON.stringify({ token: 'test' }) : undefined
          });
          
          return {
            url: testUrl,
            status: response.status,
            ok: response.ok,
            error: null
          };
        } catch (error) {
          return {
            url: testUrl,
            status: null,
            ok: false,
            error: error.message
          };
        }
      }, url);

      console.log(`Backend test - ${result.url}:`, result);
    }
  });
});