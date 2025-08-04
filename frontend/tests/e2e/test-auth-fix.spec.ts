import { test, expect } from '@playwright/test';

test('Test AuthContext Fix', async ({ page }) => {
  console.log('=== TESTING AUTHCONTEXT FIX ===');

  // Enable console logging
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  console.log('1. ✅ On login page');

  // Mock the getCurrentUser API call to simulate a successful auth state
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null
      })
    });
  });

  // Test the improved token handling
  const result = await page.evaluate(async () => {
    console.log('[TEST] Setting token and triggering token-updated event...');
    
    localStorage.setItem('token', 'test-token-123');
    
    // Trigger the new token-updated event
    window.dispatchEvent(new Event('token-updated'));
    
    console.log('[TEST] Events triggered, waiting for React to respond...');
    
    // Wait for React to respond
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      hasToken: !!localStorage.getItem('token')
    };
  });

  console.log('2. Result:', result);

  await page.waitForTimeout(1000);

  const finalState = await page.evaluate(() => ({
    url: window.location.href,
    pathname: window.location.pathname,
    hasToken: !!localStorage.getItem('token')
  }));

  console.log('3. Final state:', finalState);

  if (finalState.pathname !== '/login') {
    console.log('✅ SUCCESS: AuthContext is now reactive! Redirected to:', finalState.pathname);
  } else {
    console.log('❌ Still needs work: AuthContext not responding to token-updated event');
  }

  await page.screenshot({ path: 'test-results/auth-fix-test.png', fullPage: true });
});