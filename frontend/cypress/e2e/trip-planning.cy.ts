describe('Trip Planning Flow', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    })

    // Mock WebSocket connection
    cy.window().then((win) => {
      win.WebSocket = class MockWebSocket {
        constructor(url) {
          this.url = url
          this.readyState = 1 // OPEN
          setTimeout(() => this.onopen && this.onopen(), 100)
        }
        send() {}
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
    })

    cy.visit('/chat')
  })

  describe('Chat Interface', () => {
    it('displays chat interface for authenticated users', () => {
      cy.get('[data-testid="chat-interface"]').should('be.visible')
      cy.get('[data-testid="message-input"]').should('be.visible')
      cy.get('h1').should('contain', 'Welcome to Trip Booking Assistant')
    })

    it('shows welcome suggestions', () => {
      cy.get('[data-testid="suggestions"]').should('be.visible')
      cy.get('[data-testid="suggestion-chip"]').should('have.length.at.least', 1)
      cy.get('[data-testid="suggestion-chip"]').first().should('contain', 'plan a trip')
    })

    it('allows sending messages', () => {
      const message = 'I want to plan a trip to Tokyo'
      
      cy.get('[data-testid="message-input"] input').type(message)
      cy.get('[data-testid="send-button"]').click()
      
      cy.get('[data-testid="message-bubble"]').should('contain', message)
    })

    it('shows typing indicator when AI is responding', () => {
      cy.intercept('POST', '/api/chat/message', {
        statusCode: 200,
        delay: 2000,
        body: { message: 'AI response' },
      })

      cy.get('[data-testid="message-input"] input').type('Hello')
      cy.get('[data-testid="send-button"]').click()
      
      cy.get('[data-testid="typing-indicator"]').should('be.visible')
    })
  })

  describe('Trip Creation', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/trips', {
        statusCode: 200,
        body: { trips: [] },
      })
    })

    it('navigates to trips page', () => {
      cy.get('[data-testid="sidebar"]').within(() => {
        cy.get('a[href="/trips"]').click()
      })
      
      cy.url().should('include', '/trips')
      cy.get('h1').should('contain', 'My Trips')
    })

    it('shows empty state when no trips exist', () => {
      cy.visit('/trips')
      
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-state"]').should('contain', 'No active trips yet')
      cy.get('button').contains('Create Your First Trip').should('be.visible')
    })

    it('allows creating new trip from trips page', () => {
      cy.visit('/trips')
      
      cy.get('button').contains('Plan New Trip').click()
      cy.url().should('include', '/chat')
    })
  })

  describe('Conversation Management', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/chat/conversations', {
        statusCode: 200,
        body: {
          conversations: [
            {
              id: '1',
              title: 'Tokyo Trip Planning',
              messages: [
                {
                  id: '1',
                  sender: 'user',
                  content: 'I want to visit Tokyo',
                  timestamp: '2024-01-01T00:00:00Z',
                },
              ],
              status: 'active',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      })
    })

    it('displays conversation list', () => {
      cy.get('[data-testid="conversation-list"]').should('be.visible')
      cy.get('[data-testid="conversation-item"]').should('have.length', 1)
      cy.get('[data-testid="conversation-item"]').first().should('contain', 'Tokyo Trip Planning')
    })

    it('allows selecting conversations', () => {
      cy.get('[data-testid="conversation-item"]').first().click()
      cy.get('[data-testid="message-bubble"]').should('contain', 'I want to visit Tokyo')
    })

    it('allows creating new conversations', () => {
      cy.get('[data-testid="new-conversation-button"]').click()
      cy.get('[data-testid="message-input"]').should('be.focused')
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x')
    })

    it('hides sidebar on mobile', () => {
      cy.get('[data-testid="sidebar"]').should('not.be.visible')
    })

    it('shows mobile menu button', () => {
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
    })

    it('opens sidebar when menu button is clicked', () => {
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="sidebar"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('shows error message when API request fails', () => {
      cy.intercept('POST', '/api/chat/message', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      })

      cy.get('[data-testid="message-input"] input').type('Hello')
      cy.get('[data-testid="send-button"]').click()
      
      cy.get('[role="alert"]').should('contain', 'Internal server error')
    })

    it('shows offline indicator when disconnected', () => {
      cy.window().then((win) => {
        // Simulate WebSocket disconnection
        const mockWs = new win.WebSocket('ws://localhost:3000')
        mockWs.onclose && mockWs.onclose()
      })

      cy.get('[data-testid="connection-status"]').should('contain', 'Disconnected')
    })
  })
})