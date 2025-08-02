import { ErrorHandler } from '@/utils/errorHandler'
import { AxiosError } from 'axios'

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handle', () => {
    it('handles AxiosError with response', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request error' },
        },
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result).toEqual({
        message: 'Bad request error',
        code: 'BAD_REQUEST',
        status: 400,
        details: undefined,
      })
    })

    it('handles AxiosError without response (network error)', () => {
      const axiosError = {
        isAxiosError: true,
        request: {},
        code: 'ECONNABORTED',
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result).toEqual({
        message: 'Request timeout. Please check your connection and try again.',
        code: 'TIMEOUT',
      })
    })

    it('handles generic Error', () => {
      const error = new Error('Something went wrong')

      const result = ErrorHandler.handle(error)

      expect(result).toEqual({
        message: 'Something went wrong',
        code: 'GENERIC_ERROR',
      })
    })

    it('handles unknown error types', () => {
      const result = ErrorHandler.handle('string error')

      expect(result).toEqual({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      })
    })
  })

  describe('specific error types', () => {
    it('handles 401 unauthorized', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result.code).toBe('UNAUTHORIZED')
      expect(result.message).toContain('Authentication required')
    })

    it('handles 403 forbidden', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 403, data: {} },
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result.code).toBe('FORBIDDEN')
      expect(result.message).toContain('Access denied')
    })

    it('handles 404 not found', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404, data: {} },
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result.code).toBe('NOT_FOUND')
      expect(result.message).toContain('not found')
    })

    it('handles 500 internal server error', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: {} },
      } as AxiosError

      const result = ErrorHandler.handle(axiosError)

      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
      expect(result.message).toContain('Internal server error')
    })
  })

  describe('utility methods', () => {
    it('identifies network errors', () => {
      const networkError = {
        isAxiosError: true,
        request: {},
      } as AxiosError

      expect(ErrorHandler.isNetworkError(networkError)).toBe(true)
    })

    it('identifies auth errors', () => {
      const authError = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      } as AxiosError

      expect(ErrorHandler.isAuthError(authError)).toBe(true)
    })

    it('identifies validation errors', () => {
      const validationError = {
        isAxiosError: true,
        response: { status: 422, data: {} },
      } as AxiosError

      expect(ErrorHandler.isValidationError(validationError)).toBe(true)
    })

    it('determines if error should be retried', () => {
      const retryableError = {
        isAxiosError: true,
        response: { status: 500, data: {} },
      } as AxiosError

      const nonRetryableError = {
        isAxiosError: true,
        response: { status: 404, data: {} },
      } as AxiosError

      expect(ErrorHandler.shouldRetry(retryableError)).toBe(true)
      expect(ErrorHandler.shouldRetry(nonRetryableError)).toBe(false)
    })
  })

  describe('logError', () => {
    it('logs error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error')
      const error = new Error('Test error')

      ErrorHandler.logError(error, 'Test context')

      expect(consoleSpy).toHaveBeenCalledWith('Application Error:', expect.objectContaining({
        context: 'Test context',
        message: 'Test error',
        code: 'GENERIC_ERROR',
      }))
    })
  })
})