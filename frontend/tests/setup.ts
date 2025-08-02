import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock environment variables
beforeAll(() => {
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_API_BASE_URL: 'http://localhost:3000/api',
      VITE_WS_URL: 'http://localhost:3000',
      VITE_ENVIRONMENT: 'test',
      VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
    }
  })
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Global test cleanup
afterAll(() => {
  // Clean up any global resources
})