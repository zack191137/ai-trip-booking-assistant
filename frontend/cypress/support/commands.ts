/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with credentials
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>

      /**
       * Custom command to mock authentication
       * @example cy.mockAuth({ id: '1', email: 'test@example.com', name: 'Test User' })
       */
      mockAuth(user?: any): Chainable<void>

      /**
       * Custom command to mock API responses
       * @example cy.mockApi('GET', '/api/trips', { trips: [] })
       */
      mockApi(method: string, url: string, response: any): Chainable<void>

      /**
       * Custom command to wait for loading to complete
       * @example cy.waitForLoading()
       */
      waitForLoading(): Chainable<void>

      /**
       * Custom command to create a test trip
       * @example cy.createTestTrip({ title: 'Tokyo Trip' })
       */
      createTestTrip(tripData?: any): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('mockAuth', (user = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}) => {
  cy.intercept('GET', '/api/auth/me', {
    statusCode: 200,
    body: { user },
  }).as('authCheck')

  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: { user, message: 'Login successful' },
  }).as('login')

  cy.intercept('POST', '/api/auth/register', {
    statusCode: 201,
    body: { user, message: 'Registration successful' },
  }).as('register')

  cy.intercept('POST', '/api/auth/logout', {
    statusCode: 200,
    body: { message: 'Logout successful' },
  }).as('logout')
})

Cypress.Commands.add('mockApi', (method: string, url: string, response: any) => {
  cy.intercept(method, url, {
    statusCode: 200,
    body: response,
  })
})

Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
  cy.get('[role="progressbar"]', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('createTestTrip', (tripData = {}) => {
  const defaultTrip = {
    id: 'test-trip-1',
    userId: '1',
    conversationId: 'test-conversation-1',
    title: 'Test Trip to Paris',
    description: 'A wonderful test trip',
    destination: {
      city: 'Paris',
      country: 'France',
      coordinates: { lat: 48.8566, lng: 2.3522 },
    },
    dates: {
      startDate: '2024-06-01',
      endDate: '2024-06-08',
      duration: 7,
    },
    budget: {
      total: 3000,
      currency: 'USD',
      breakdown: {
        flights: 800,
        accommodation: 1200,
        activities: 600,
        food: 300,
        transportation: 100,
        other: 0,
      },
    },
    travelers: {
      adults: 2,
      children: 0,
    },
    preferences: {
      travelStyle: ['Cultural', 'Sightseeing'],
      interests: ['Museums', 'Architecture'],
      dietary: [],
      accessibility: [],
    },
    itinerary: [],
    bookings: {
      flights: [],
      hotels: [],
      activities: [],
    },
    status: 'draft',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...tripData,
  }

  cy.intercept('POST', '/api/trips', {
    statusCode: 201,
    body: { trip: defaultTrip },
  }).as('createTrip')

  cy.intercept('GET', '/api/trips', {
    statusCode: 200,
    body: { trips: [defaultTrip] },
  }).as('getTrips')

  cy.intercept('GET', `/api/trips/${defaultTrip.id}`, {
    statusCode: 200,
    body: { trip: defaultTrip },
  }).as('getTrip')
})

// Mock WebSocket for testing
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    win.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url
        this.readyState = 1 // OPEN
        this.onopen = null
        this.onclose = null
        this.onmessage = null
        this.onerror = null
        
        // Simulate connection after a short delay
        setTimeout(() => {
          if (this.onopen) this.onopen()
        }, 100)
      }
      
      send(data) {
        // Mock sending data
        console.log('WebSocket send:', data)
      }
      
      close() {
        this.readyState = 3 // CLOSED
        if (this.onclose) this.onclose()
      }
      
      addEventListener(type, listener) {
        this[`on${type}`] = listener
      }
      
      removeEventListener(type, listener) {
        this[`on${type}`] = null
      }
    }
  })
})

export {}