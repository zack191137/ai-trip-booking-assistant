import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { darkTheme } from '@/styles/theme'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { TripProvider } from '@/contexts/TripContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { AppProvider } from '@/contexts/AppContext'

// Mock providers for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockAuthContext = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    googleLogin: vi.fn(),
    clearError: vi.fn(),
  }

  return (
    <AuthProvider value={mockAuthContext}>
      {children}
    </AuthProvider>
  )
}

const MockChatProvider = ({ children }: { children: React.ReactNode }) => {
  const mockChatContext = {
    conversations: [],
    currentConversation: null,
    isLoading: false,
    isConnected: true,
    error: null,
    sendMessage: vi.fn(),
    createConversation: vi.fn(),
    selectConversation: vi.fn(),
    deleteConversation: vi.fn(),
    clearError: vi.fn(),
    loadConversations: vi.fn(),
  }

  return (
    <ChatProvider value={mockChatContext}>
      {children}
    </ChatProvider>
  )
}

const MockTripProvider = ({ children }: { children: React.ReactNode }) => {
  const mockTripContext = {
    trips: [],
    currentTrip: null,
    isLoading: false,
    error: null,
    loadTrips: vi.fn(),
    loadTrip: vi.fn(),
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
    selectTrip: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
  }

  return (
    <TripProvider value={mockTripContext}>
      {children}
    </TripProvider>
  )
}

interface AllTheProvidersProps {
  children: React.ReactNode
  options?: {
    route?: string
    user?: any
    authenticated?: boolean
  }
}

const AllTheProviders = ({ children, options = {} }: AllTheProvidersProps) => {
  const { route = '/', authenticated = true } = options

  return (
    <BrowserRouter>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <ErrorProvider>
          <AppProvider>
            {authenticated ? (
              <MockAuthProvider>
                <MockTripProvider>
                  <MockChatProvider>
                    {children}
                  </MockChatProvider>
                </MockTripProvider>
              </MockAuthProvider>
            ) : (
              <AuthProvider>
                {children}
              </AuthProvider>
            )}
          </AppProvider>
        </ErrorProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    route?: string
    user?: any
    authenticated?: boolean
  }
) => {
  const { route, user, authenticated, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders options={{ route, user, authenticated }}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock fetch for API calls
export const mockFetch = () => {
  global.fetch = vi.fn()
}

// Mock localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
  
  return localStorageMock
}

// Mock WebSocket
export const mockWebSocket = () => {
  const WebSocketMock = vi.fn(() => ({
    close: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  }))
  
  global.WebSocket = WebSocketMock as any
  return WebSocketMock
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const IntersectionObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))
  
  global.IntersectionObserver = IntersectionObserverMock as any
  global.IntersectionObserverEntry = {} as any
  
  return IntersectionObserverMock
}

// Helper to create mock trip data
export const createMockTrip = (overrides = {}) => ({
  id: 'test-trip-id',
  userId: 'test-user-id',
  conversationId: 'test-conversation-id',
  title: 'Test Trip to Paris',
  description: 'A wonderful trip to the City of Light',
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
  status: 'draft' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create mock conversation data
export const createMockConversation = (overrides = {}) => ({
  id: 'test-conversation-id',
  userId: 'test-user-id',
  title: 'Trip Planning Conversation',
  messages: [],
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create mock message data
export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  conversationId: 'test-conversation-id',
  sender: 'user' as const,
  content: 'Hello, I want to plan a trip to Paris',
  timestamp: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { vi } from 'vitest'