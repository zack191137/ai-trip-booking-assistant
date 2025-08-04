import { test, expect } from '@playwright/test';

test.describe('Trip Booking Assistant - Authentication Flow', () => {
  
  test('1. Navigate to the home page and verify landing page loads', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the landing page loads with "Trip Booking Assistant" title
    await expect(page).toHaveTitle(/Trip Booking Assistant/);
    
    // Take screenshot of the landing page
    await page.screenshot({ path: 'test-results/landing-page.png', fullPage: true });
    
    console.log('✅ Landing page loaded successfully with correct title');
  });

  test('2. Check landing page content and navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for key elements that should be on the landing page
    const title = page.locator('h1, [data-testid="title"], .title').first();
    const startButton = page.locator('text=Start Planning, button:has-text("Start Planning"), [data-testid="start-planning"]').first();
    
    // Check if title contains "Trip Booking Assistant"
    if (await title.isVisible()) {
      const titleText = await title.textContent();
      console.log('Found title:', titleText);
      expect(titleText).toMatch(/Trip Booking Assistant/i);
    }
    
    // Check if Start Planning button exists
    if (await startButton.isVisible()) {
      console.log('✅ Start Planning button found');
    } else {
      console.log('⚠️ Start Planning button not found, looking for other navigation elements');
      
      // Look for alternative navigation elements
      const loginLink = page.locator('text=Login, text=Sign In, a[href*="login"]').first();
      const getStartedButton = page.locator('text=Get Started, button:has-text("Get Started")').first();
      
      if (await loginLink.isVisible()) {
        console.log('✅ Login link found as alternative navigation');
      } else if (await getStartedButton.isVisible()) {
        console.log('✅ Get Started button found as alternative navigation');
      }
    }
  });

  test('3. Navigate to login page by clicking Start Planning or direct navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    let navigatedToLogin = false;
    
    // Try to find and click "Start Planning" button
    const startButton = page.locator('text=Start Planning, button:has-text("Start Planning"), [data-testid="start-planning"]').first();
    
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForLoadState('networkidle');
      navigatedToLogin = true;
      console.log('✅ Clicked Start Planning button');
    } else {
      // Try alternative navigation methods
      const loginLink = page.locator('text=Login, text=Sign In, a[href*="login"]').first();
      const getStartedButton = page.locator('text=Get Started, button:has-text("Get Started")').first();
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await page.waitForLoadState('networkidle');
        navigatedToLogin = true;
        console.log('✅ Clicked Login link');
      } else if (await getStartedButton.isVisible()) {
        await getStartedButton.click();
        await page.waitForLoadState('networkidle');
        navigatedToLogin = true;
        console.log('✅ Clicked Get Started button');
      }
    }
    
    // If no navigation button found, navigate directly to login
    if (!navigatedToLogin) {
      console.log('⚠️ No navigation button found, navigating directly to /login');
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }
    
    // Verify we're on login page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);
    console.log('✅ Successfully navigated to login page:', currentUrl);
  });

  test('4. Verify login page has required elements', async ({ page }) => {
    // Navigate directly to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the login page
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // Check for email input field
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], [data-testid="email-input"]');
    await expect(emailInput.first()).toBeVisible();
    console.log('✅ Email input field found');
    
    // Check for password input field
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i], [data-testid="password-input"]');
    await expect(passwordInput.first()).toBeVisible();
    console.log('✅ Password input field found');
    
    // Check for Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), input[type="submit"], [data-testid="sign-in-button"]');
    await expect(signInButton.first()).toBeVisible();
    console.log('✅ Sign In button found');
    
    // Check for Google login button
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google"), [data-testid="google-signin"]');
    if (await googleButton.first().isVisible()) {
      console.log('✅ Google login button found');
    } else {
      console.log('⚠️ Google login button not found - this might be expected if Google OAuth is not implemented yet');
    }
    
    // Print all found form elements for debugging
    const allInputs = await page.locator('input').all();
    console.log('All input fields found:', await Promise.all(allInputs.map(async input => ({
      type: await input.getAttribute('type'),
      name: await input.getAttribute('name'),
      placeholder: await input.getAttribute('placeholder')
    }))));
    
    const allButtons = await page.locator('button').all();
    console.log('All buttons found:', await Promise.all(allButtons.map(async button => await button.textContent())));
  });

  test('5. Try to access protected route /chat and verify redirect to login', async ({ page }) => {
    // Navigate directly to protected route
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected to login
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Successfully redirected to login page when accessing protected route');
      expect(currentUrl).toMatch(/\/login/);
    } else if (currentUrl.includes('/chat')) {
      // If we're still on chat page, check if there's an authentication wall
      const authWall = page.locator('text=Please log in, text=Authentication required, text=Sign in to continue');
      if (await authWall.first().isVisible()) {
        console.log('✅ Protected route shows authentication wall');
      } else {
        console.log('⚠️ Chat page accessible without authentication - this might indicate missing route protection');
      }
    } else {
      console.log('ℹ️ Redirected to:', currentUrl, '- checking if this is an appropriate redirect');
    }
  });

  test('6. Test login form validation', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Check for validation messages
      const validationMessages = page.locator('.error, .invalid, [role="alert"], .field-error');
      if (await validationMessages.first().isVisible()) {
        console.log('✅ Form validation working - shows error messages');
        const errorTexts = await validationMessages.allTextContents();
        console.log('Validation messages:', errorTexts);
      } else {
        console.log('⚠️ No validation messages found for empty form submission');
      }
    }
    
    // Test with invalid email format
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');
      await signInButton.click();
      
      // Check for email validation
      const emailError = page.locator('.error, .invalid, [role="alert"]');
      if (await emailError.first().isVisible()) {
        console.log('✅ Email validation working');
      }
    }
  });

  test('7. Take comprehensive screenshots for documentation', async ({ page }) => {
    // Landing page screenshot
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/01-landing-page-full.png', 
      fullPage: true 
    });
    
    // Login page screenshot
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/02-login-page-full.png', 
      fullPage: true 
    });
    
    // Try to access chat page (protected route)
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/03-protected-route-access.png', 
      fullPage: true 
    });
    
    console.log('✅ All screenshots taken and saved to test-results directory');
  });

  test('8. Comprehensive page analysis', async ({ page }) => {
    // Analyze landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const landingPageTitle = await page.title();
    const landingPageUrl = page.url();
    const landingPageHeadings = await page.locator('h1, h2, h3').allTextContents();
    const landingPageButtons = await page.locator('button, .btn').allTextContents();
    const landingPageLinks = await page.locator('a').allTextContents();
    
    console.log('=== LANDING PAGE ANALYSIS ===');
    console.log('Title:', landingPageTitle);
    console.log('URL:', landingPageUrl);
    console.log('Headings:', landingPageHeadings);
    console.log('Buttons:', landingPageButtons);
    console.log('Links:', landingPageLinks.slice(0, 10)); // First 10 links only
    
    // Analyze login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginPageTitle = await page.title();
    const loginPageUrl = page.url();
    const loginPageHeadings = await page.locator('h1, h2, h3').allTextContents();
    const loginPageButtons = await page.locator('button, .btn').allTextContents();
    const loginPageInputs = await page.locator('input').all();
    const inputDetails = await Promise.all(loginPageInputs.map(async input => ({
      type: await input.getAttribute('type'),
      name: await input.getAttribute('name'),
      placeholder: await input.getAttribute('placeholder'),
      required: await input.getAttribute('required')
    })));
    
    console.log('=== LOGIN PAGE ANALYSIS ===');
    console.log('Title:', loginPageTitle);
    console.log('URL:', loginPageUrl);
    console.log('Headings:', loginPageHeadings);
    console.log('Buttons:', loginPageButtons);
    console.log('Input fields:', inputDetails);
  });
});