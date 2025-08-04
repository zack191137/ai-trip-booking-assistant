import { test, expect } from '@playwright/test';

test.describe('Authentication Redirect Flow Tests', () => {
  
  test('1. Navigate to /chat directly and verify redirect to /login', async ({ page }) => {
    console.log('Testing direct navigation to /chat...');
    
    // Navigate directly to /chat
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check current URL - should be redirected to login
    const currentUrl = page.url();
    console.log('Current URL after navigating to /chat:', currentUrl);
    
    // Verify redirect to login
    expect(currentUrl).toMatch(/\/login/);
    console.log('✅ Successfully redirected to login when accessing /chat directly');
    
    // Take screenshot showing the redirect
    await page.screenshot({ 
      path: 'test-results/chat-redirect-to-login.png', 
      fullPage: true 
    });
  });

  test('2. Verify page title is "Trip Booking Assistant"', async ({ page }) => {
    console.log('Testing page title...');
    
    // Check title on landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const landingTitle = await page.title();
    console.log('Landing page title:', landingTitle);
    expect(landingTitle).toBe('Trip Booking Assistant');
    
    // Check title on login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginTitle = await page.title();
    console.log('Login page title:', loginTitle);
    expect(loginTitle).toBe('Trip Booking Assistant');
    
    console.log('✅ Page title correctly set to "Trip Booking Assistant"');
  });

  test('3. Verify protected routes redirect to login', async ({ page }) => {
    console.log('Testing protected routes redirect behavior...');
    
    const protectedRoutes = ['/chat', '/profile', '/trip/123'];
    
    for (const route of protectedRoutes) {
      console.log(`Testing route: ${route}`);
      
      // Navigate to protected route
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Check if redirected to login
      const currentUrl = page.url();
      console.log(`After navigating to ${route}, current URL: ${currentUrl}`);
      
      expect(currentUrl).toMatch(/\/login/);
      console.log(`✅ ${route} correctly redirects to login`);
    }
    
    // Take screenshot showing final redirect state
    await page.screenshot({ 
      path: 'test-results/protected-routes-redirect.png', 
      fullPage: true 
    });
  });

  test('4. Comprehensive redirect behavior screenshot', async ({ page }) => {
    console.log('Taking comprehensive screenshots of redirect behavior...');
    
    // 1. Screenshot of landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/01-landing-page.png', 
      fullPage: true 
    });
    console.log('✅ Landing page screenshot taken');
    
    // 2. Screenshot after trying to access /chat
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/02-chat-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Chat redirect screenshot taken');
    
    // 3. Screenshot after trying to access /profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/03-profile-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Profile redirect screenshot taken');
    
    // 4. Screenshot after trying to access /trip/123
    await page.goto('/trip/123');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/04-trip-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Trip redirect screenshot taken');
    
    // 5. Final login page screenshot
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/05-login-page-final.png', 
      fullPage: true 
    });
    console.log('✅ Final login page screenshot taken');
  });

  test('5. Detailed analysis of authentication flow', async ({ page }) => {
    console.log('Performing detailed analysis of authentication flow...');
    
    const testResults = {
      landingPage: {},
      chatRedirect: {},
      profileRedirect: {},
      tripRedirect: {},
      loginPage: {}
    };
    
    // Test landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    testResults.landingPage = {
      url: page.url(),
      title: await page.title(),
      hasAuthElements: await page.locator('text=Login, text=Sign In, button:has-text("Login")').first().isVisible()
    };
    
    // Test chat redirect
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    testResults.chatRedirect = {
      originalRoute: '/chat',
      redirectedUrl: page.url(),
      redirectedToLogin: page.url().includes('/login'),
      title: await page.title()
    };
    
    // Test profile redirect
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    testResults.profileRedirect = {
      originalRoute: '/profile',
      redirectedUrl: page.url(),
      redirectedToLogin: page.url().includes('/login'),
      title: await page.title()
    };
    
    // Test trip redirect
    await page.goto('/trip/123');
    await page.waitForLoadState('networkidle');
    testResults.tripRedirect = {
      originalRoute: '/trip/123',
      redirectedUrl: page.url(),
      redirectedToLogin: page.url().includes('/login'),
      title: await page.title()
    };
    
    // Test login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    testResults.loginPage = {
      url: page.url(),
      title: await page.title(),
      hasEmailInput: await page.locator('input[type="email"], input[name="email"]').first().isVisible(),
      hasPasswordInput: await page.locator('input[type="password"], input[name="password"]').first().isVisible(),
      hasSubmitButton: await page.locator('button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first().isVisible()
    };
    
    console.log('=== AUTHENTICATION FLOW TEST RESULTS ===');
    console.log('Landing Page:', JSON.stringify(testResults.landingPage, null, 2));
    console.log('Chat Redirect:', JSON.stringify(testResults.chatRedirect, null, 2));
    console.log('Profile Redirect:', JSON.stringify(testResults.profileRedirect, null, 2));
    console.log('Trip Redirect:', JSON.stringify(testResults.tripRedirect, null, 2));
    console.log('Login Page:', JSON.stringify(testResults.loginPage, null, 2));
    
    // Assertions
    expect(testResults.landingPage.title).toBe('Trip Booking Assistant');
    expect(testResults.chatRedirect.redirectedToLogin).toBe(true);
    expect(testResults.profileRedirect.redirectedToLogin).toBe(true);
    expect(testResults.tripRedirect.redirectedToLogin).toBe(true);
    expect(testResults.loginPage.title).toBe('Trip Booking Assistant');
    expect(testResults.loginPage.hasEmailInput).toBe(true);
    expect(testResults.loginPage.hasPasswordInput).toBe(true);
    
    console.log('✅ All authentication flow tests passed!');
  });
});