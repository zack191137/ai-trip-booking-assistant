describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth')
  })

  describe('Login', () => {
    it('displays login form by default', () => {
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('h1').should('contain', 'Welcome Back')
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('contain', 'Sign In')
    })

    it('shows validation errors for empty fields', () => {
      cy.get('button[type="submit"]').click()
      cy.get('[role="alert"]').should('contain', 'Email is required')
      cy.get('[role="alert"]').should('contain', 'Password is required')
    })

    it('shows validation error for invalid email', () => {
      cy.get('input[type="email"]').type('invalid-email')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      cy.get('[role="alert"]').should('contain', 'Email is invalid')
    })

    it('successfully logs in with valid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
          message: 'Login successful',
        },
      }).as('loginRequest')

      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      cy.wait('@loginRequest')
      cy.url().should('include', '/chat')
    })

    it('shows error message for invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      }).as('loginError')

      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()

      cy.wait('@loginError')
      cy.get('[role="alert"]').should('contain', 'Invalid credentials')
    })
  })

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('button').contains('Sign up').click()
    })

    it('displays registration form', () => {
      cy.get('[data-testid="register-form"]').should('be.visible')
      cy.get('h1').should('contain', 'Create Account')
      cy.get('input[name="name"]').should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').first().should('be.visible')
      cy.get('input[type="password"]').last().should('be.visible')
    })

    it('validates password confirmation', () => {
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('password123')
      cy.get('input[type="password"]').last().type('password456')
      cy.get('button[type="submit"]').click()

      cy.get('[role="alert"]').should('contain', 'Passwords do not match')
    })

    it('successfully registers with valid data', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
          message: 'Registration successful',
        },
      }).as('registerRequest')

      cy.get('input[name="name"]').type('Test User')
      cy.get('input[type="email"]').type('test@example.com')
      cy.get('input[type="password"]').first().type('password123')
      cy.get('input[type="password"]').last().type('password123')
      cy.get('button[type="submit"]').click()

      cy.wait('@registerRequest')
      cy.url().should('include', '/chat')
    })
  })

  describe('Google OAuth', () => {
    it('displays Google login button', () => {
      cy.get('[data-testid="google-login"]').should('be.visible')
    })

    // Note: Actual Google OAuth testing would require special setup
    // This is a placeholder for integration testing
  })

  describe('Form Switching', () => {
    it('switches between login and registration forms', () => {
      // Start with login form
      cy.get('h1').should('contain', 'Welcome Back')
      
      // Switch to registration
      cy.get('button').contains('Sign up').click()
      cy.get('h1').should('contain', 'Create Account')
      
      // Switch back to login
      cy.get('button').contains('Sign in').click()
      cy.get('h1').should('contain', 'Welcome Back')
    })
  })
})