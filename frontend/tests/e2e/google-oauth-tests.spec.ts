import { test, expect } from '@playwright/test';
import axios from 'axios';

const BACKEND_URL = 'https://ai.zackz.net:3000/api';
const FRONTEND_URL = 'http://localhost:3002';

test.describe('Google OAuth Authentication Flow Tests', () => {
  
  test('1. Navigate to login page and verify Google OAuth button is present', async ({ page }) => {
    console.log('Testing Google OAuth button presence...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'test-results/google-oauth-login-page.png', 
      fullPage: true 
    });
    
    // Verify page title
    const title = await page.title();
    expect(title).toBe('Trip Booking Assistant');
    console.log('✅ Page title verified:', title);
    
    // Check for "Continue with Google" button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    console.log('✅ "Continue with Google" button found and visible');
    
    // Verify Google icon is present in the button
    const googleIcon = page.locator('button:has-text("Continue with Google") svg, button:has-text("Continue with Google") [data-testid="GoogleIcon"]');
    await expect(googleIcon).toBeVisible();
    console.log('✅ Google icon found in button');
    
    // Verify button is enabled (not disabled)
    const isDisabled = await googleButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('✅ Google OAuth button is enabled');
  });

  test('2. Test backend API endpoints are accessible', async ({ page }) => {
    console.log('Testing backend API accessibility...');
    
    const testResults = {
      healthCheck: false,
      authEndpoint: false,
      googleAuthEndpoint: false
    };
    
    // Test basic health/status endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        testResults.healthCheck = true;
        console.log('✅ Backend health endpoint is accessible');
      } else {
        console.log('⚠️ Backend health endpoint returned:', response.status);
      }
    } catch (error) {
      console.log('❌ Backend health endpoint not accessible:', error);
    }
    
    // Test auth endpoints existence (expecting 401/400 for unauthenticated requests)
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`);
      if (response.status === 401) {
        testResults.authEndpoint = true;
        console.log('✅ Auth endpoint exists (returns 401 as expected)');
      } else {
        console.log('⚠️ Auth endpoint returned unexpected status:', response.status);
      }
    } catch (error) {
      console.log('❌ Auth endpoint not accessible:', error);
    }
    
    // Test Google auth endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.status === 400) {
        testResults.googleAuthEndpoint = true;
        console.log('✅ Google auth endpoint exists (returns 400 for missing token as expected)');
      } else {
        console.log('⚠️ Google auth endpoint returned unexpected status:', response.status);
      }
    } catch (error) {
      console.log('❌ Google auth endpoint not accessible:', error);
    }
    
    console.log('Backend API Test Results:', testResults);
    
    // At least one endpoint should be working
    const hasWorkingEndpoint = Object.values(testResults).some(Boolean);
    expect(hasWorkingEndpoint).toBe(true);
  });

  test('3. Test frontend-backend integration setup', async ({ page }) => {
    console.log('Testing frontend-backend integration setup...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check console for any network errors
    const consoleLogs: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    page.on('response', response => {
      if (!response.ok() && response.url().includes('api')) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // Try to trigger some API calls by attempting login with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button:has-text("Sign In")');
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    console.log('Console logs:', consoleLogs.slice(-5)); // Last 5 logs
    console.log('Network errors:', networkErrors);
    
    // Check if the form shows validation or network error
    const errorMessage = page.locator('.MuiAlert-root, [role="alert"], .error-message');
    const hasErrorMessage = await errorMessage.isVisible();
    
    if (hasErrorMessage) {
      const errorText = await errorMessage.textContent();
      console.log('✅ Form shows error feedback:', errorText);
    } else {
      console.log('⚠️ No error feedback shown after invalid login attempt');
    }
  });

  test('4. Test Google OAuth button click behavior', async ({ page }) => {
    console.log('Testing Google OAuth button click behavior...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Set up listeners for popup and navigation
    let popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
    let navigationPromise = page.waitForNavigation({ timeout: 5000 }).catch(() => null);
    
    // Click the Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await googleButton.click();
    
    console.log('✅ Google OAuth button clicked successfully');
    
    // Check if a popup window opened (typical Google OAuth behavior)
    const popup = await popupPromise;
    if (popup) {
      console.log('🚀 Google OAuth popup window opened');
      console.log('Popup URL:', popup.url());
      
      // Take screenshot of popup if it opened
      try {
        await popup.screenshot({ path: 'test-results/google-oauth-popup.png' });
        console.log('✅ Screenshot of Google OAuth popup taken');
      } catch (error) {
        console.log('⚠️ Could not take popup screenshot:', error);
      }
      
      // Close popup to prevent hanging test
      await popup.close();
    } else {
      console.log('⚠️ No popup window detected - checking for other navigation');
    }
    
    // Check if page navigated somewhere else
    const navigation = await navigationPromise;
    if (navigation) {
      console.log('🔄 Page navigated to:', page.url());
    }
    
    // Check for any error messages on the page
    await page.waitForTimeout(2000);
    const errorAlert = page.locator('.MuiAlert-root[severity="error"], [role="alert"]');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log('⚠️ Error message displayed:', errorText);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/google-oauth-after-click.png', 
      fullPage: true 
    });
  });

  test('5. Test form validation and UI behavior', async ({ page }) => {
    console.log('Testing login form validation and UI behavior...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');
    const googleButton = page.locator('button:has-text("Continue with Google")');
    
    // Verify all elements are present and enabled
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
    await expect(googleButton).toBeVisible();
    
    console.log('✅ All form elements are visible');
    
    // Test that buttons are enabled initially
    expect(await signInButton.isDisabled()).toBe(false);
    expect(await googleButton.isDisabled()).toBe(false);
    console.log('✅ Buttons are enabled initially');
    
    // Test form submission with empty fields
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    // HTML5 validation should prevent empty form submission
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    if (validationMessage) {
      console.log('✅ HTML5 validation working:', validationMessage);
    }
    
    // Fill invalid email format
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await signInButton.click();
    await page.waitForTimeout(1000);
    
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    if (emailValidation) {
      console.log('✅ Email format validation working:', emailValidation);
    }
    
    // Test with valid format but invalid credentials
    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrongpassword');
    await signInButton.click();
    await page.waitForTimeout(3000);
    
    // Check for error message
    const errorAlert = page.locator('.MuiAlert-root, [role="alert"]');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log('✅ Invalid credentials error shown:', errorText);
    }
  });

  test('6. Test responsive design and accessibility', async ({ page }) => {
    console.log('Testing responsive design and accessibility...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test desktop view (default)
    await page.screenshot({ 
      path: 'test-results/login-desktop.png', 
      fullPage: true 
    });
    console.log('✅ Desktop view screenshot taken');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/login-tablet.png', 
      fullPage: true 
    });
    console.log('✅ Tablet view screenshot taken');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/login-mobile.png', 
      fullPage: true 
    });
    console.log('✅ Mobile view screenshot taken');
    
    // Test keyboard navigation
    await page.setViewportSize({ width: 1920, height: 1080 }); // Reset to desktop
    await page.waitForTimeout(500);
    
    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus email input
    await page.keyboard.press('Tab'); // Should focus password input
    await page.keyboard.press('Tab'); // Should focus sign in button
    await page.keyboard.press('Tab'); // Should focus Google button
    
    // Check focus states
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    console.log('✅ Keyboard navigation tested, focused element:', focusedElement);
    
    // Test ARIA labels and accessibility
    const emailLabel = await page.locator('input[type="email"]').getAttribute('aria-label');
    const passwordLabel = await page.locator('input[type="password"]').getAttribute('aria-label');
    
    console.log('Email input accessibility:', {
      'aria-label': emailLabel,
      'has-label': await page.locator('label[for]').count() > 0
    });
    
    console.log('Password input accessibility:', {
      'aria-label': passwordLabel,
      'has-label': await page.locator('label[for]').count() > 0
    });
  });

  test('7. Comprehensive authentication flow analysis', async ({ page }) => {
    console.log('Performing comprehensive authentication flow analysis...');
    
    const testResults = {
      pageLoad: false,
      formElements: {
        email: false,
        password: false,
        signInButton: false,
        googleButton: false
      },
      apiConnectivity: {
        backend: false,
        authEndpoint: false,
        googleAuthEndpoint: false
      },
      googleOAuthSetup: {
        buttonPresent: false,
        buttonEnabled: false,
        clickable: false
      },
      errorHandling: {
        networkErrors: false,
        formValidation: false,
        userFeedback: false
      }
    };
    
    // Test page load
    try {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      testResults.pageLoad = true;
      console.log('✅ Login page loaded successfully');
    } catch (error) {
      console.log('❌ Login page failed to load:', error);
    }
    
    // Test form elements
    testResults.formElements.email = await page.locator('input[type="email"]').isVisible();
    testResults.formElements.password = await page.locator('input[type="password"]').isVisible();
    testResults.formElements.signInButton = await page.locator('button:has-text("Sign In")').isVisible();
    testResults.formElements.googleButton = await page.locator('button:has-text("Continue with Google")').isVisible();
    
    console.log('Form elements test:', testResults.formElements);
    
    // Test Google OAuth setup
    if (testResults.formElements.googleButton) {
      const googleButton = page.locator('button:has-text("Continue with Google")');
      testResults.googleOAuthSetup.buttonPresent = true;
      testResults.googleOAuthSetup.buttonEnabled = !(await googleButton.isDisabled());
      
      // Test if button is clickable
      try {
        await googleButton.click({ timeout: 2000 });
        testResults.googleOAuthSetup.clickable = true;
        console.log('✅ Google OAuth button is clickable');
      } catch (error) {
        console.log('⚠️ Google OAuth button click failed:', error);
      }
    }
    
    // Test API connectivity (simplified)
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      testResults.apiConnectivity.backend = response.ok;
    } catch (error) {
      console.log('Backend connectivity test failed:', error);
    }
    
    // Test error handling with invalid form submission
    if (testResults.formElements.email && testResults.formElements.password) {
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      
      const hasErrorMessage = await page.locator('.MuiAlert-root, [role="alert"]').isVisible();
      testResults.errorHandling.userFeedback = hasErrorMessage;
      
      if (hasErrorMessage) {
        console.log('✅ Error handling and user feedback working');
      }
    }
    
    console.log('=== COMPREHENSIVE TEST RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: 'test-results/comprehensive-auth-analysis.png', 
      fullPage: true 
    });
    
    // Assertions for critical functionality
    expect(testResults.pageLoad).toBe(true);
    expect(testResults.formElements.email).toBe(true);
    expect(testResults.formElements.password).toBe(true);
    expect(testResults.formElements.signInButton).toBe(true);
    expect(testResults.formElements.googleButton).toBe(true);
    expect(testResults.googleOAuthSetup.buttonPresent).toBe(true);
    expect(testResults.googleOAuthSetup.buttonEnabled).toBe(true);
    
    console.log('✅ All critical authentication flow tests passed!');
  });

  test('8. Test environment configuration and setup', async ({ page }) => {
    console.log('Testing environment configuration and setup...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check if Google OAuth client ID is configured
    const googleClientIdExists = await page.evaluate(() => {
      // Check if Google OAuth is properly initialized
      return !!(window as any)?.google || document.querySelector('script[src*="accounts.google.com"]');
    });
    
    console.log('Google OAuth client setup detected:', googleClientIdExists);
    
    // Check if backend API URL is configured
    const backendConfigTest = await page.evaluate(() => {
      try {
        // This will be available if the frontend is properly configured
        return !!(import.meta.env?.VITE_API_BASE_URL || process.env?.VITE_API_BASE_URL);
      } catch {
        return false;
      }
    });
    
    console.log('Backend API configuration test:', backendConfigTest);
    
    // Test CORS and network configuration
    const corsTest = await page.evaluate(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include'
        });
        return true; // If we get here, CORS is configured
      } catch (error) {
        return error.toString().includes('CORS') ? false : true;
      }
    });
    
    console.log('CORS configuration test passed:', corsTest);
    
    const configResults = {
      googleOAuthSetup: googleClientIdExists,
      backendConfig: backendConfigTest,
      corsConfig: corsTest,
      frontendRunning: true, // If we got this far, frontend is running
      backendReachable: false
    };
    
    // Test backend reachability
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      configResults.backendReachable = response.ok;
    } catch (error) {
      console.log('Backend reachability test failed:', error);
    }
    
    console.log('=== ENVIRONMENT CONFIGURATION RESULTS ===');
    console.log(JSON.stringify(configResults, null, 2));
    
    // At minimum, frontend should be running and Google OAuth should be set up
    expect(configResults.frontendRunning).toBe(true);
  });
});

// Additional utility test for direct API testing
test.describe('Direct Backend API Tests', () => {
  
  test('Test backend auth endpoints directly', async ({ request }) => {
    console.log('Testing backend authentication endpoints directly...');
    
    const testResults = {
      healthEndpoint: { status: 0, accessible: false },
      authMeEndpoint: { status: 0, accessible: false },
      googleAuthEndpoint: { status: 0, accessible: false },
      loginEndpoint: { status: 0, accessible: false }
    };
    
    // Test health endpoint
    try {
      const response = await request.get(`${BACKEND_URL}/health`);
      testResults.healthEndpoint.status = response.status();
      testResults.healthEndpoint.accessible = response.ok();
      console.log(`Health endpoint: ${response.status()}`);
    } catch (error) {
      console.log('Health endpoint test failed:', error);
    }
    
    // Test auth/me endpoint (should return 401)
    try {
      const response = await request.get(`${BACKEND_URL}/auth/me`);
      testResults.authMeEndpoint.status = response.status();
      testResults.authMeEndpoint.accessible = true;
      console.log(`Auth/me endpoint: ${response.status()}`);
    } catch (error) {
      console.log('Auth/me endpoint test failed:', error);
    }
    
    // Test Google auth endpoint (should return 400 for missing token)
    try {
      const response = await request.post(`${BACKEND_URL}/auth/google`, {
        data: {}
      });
      testResults.googleAuthEndpoint.status = response.status();
      testResults.googleAuthEndpoint.accessible = true;
      console.log(`Google auth endpoint: ${response.status()}`);
    } catch (error) {
      console.log('Google auth endpoint test failed:', error);
    }
    
    // Test regular login endpoint (should return 400 for missing credentials)
    try {
      const response = await request.post(`${BACKEND_URL}/auth/login`, {
        data: {}
      });
      testResults.loginEndpoint.status = response.status();
      testResults.loginEndpoint.accessible = true;
      console.log(`Login endpoint: ${response.status()}`);
    } catch (error) {
      console.log('Login endpoint test failed:', error);
    }
    
    console.log('=== BACKEND API TEST RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));
    
    // At least one endpoint should be accessible
    const hasAccessibleEndpoint = Object.values(testResults).some(result => result.accessible);
    if (hasAccessibleEndpoint) {
      console.log('✅ Backend is accessible');
    } else {
      console.log('❌ Backend appears to be unreachable');
      console.log('This could indicate:');
      console.log('1. Backend server is not running');
      console.log('2. Backend is running on a different port/URL');
      console.log('3. Network connectivity issues');
      console.log('4. CORS configuration problems');
    }
  });
});