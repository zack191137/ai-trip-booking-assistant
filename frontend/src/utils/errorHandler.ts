import { AxiosError } from 'axios'

export interface AppError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error)
    }
    
    if (error instanceof Error) {
      return this.handleGenericError(error)
    }
    
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    }
  }

  private static handleAxiosError(error: AxiosError): AppError {
    const response = error.response
    const request = error.request
    
    if (response) {
      // Server responded with error status
      const status = response.status
      const data = response.data as { message?: string }
      
      switch (status) {
        case 400:
          return {
            message: data?.message || 'Invalid request. Please check your input.',
            code: 'BAD_REQUEST',
            status,
            details: data?.errors,
          }
        
        case 401:
          return {
            message: 'Authentication required. Please log in.',
            code: 'UNAUTHORIZED',
            status,
          }
        
        case 403:
          return {
            message: 'Access denied. You do not have permission to perform this action.',
            code: 'FORBIDDEN',
            status,
          }
        
        case 404:
          return {
            message: data?.message || 'The requested resource was not found.',
            code: 'NOT_FOUND',
            status,
          }
        
        case 422:
          return {
            message: data?.message || 'Validation failed. Please check your input.',
            code: 'VALIDATION_ERROR',
            status,
            details: data?.errors,
          }
        
        case 429:
          return {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMITED',
            status,
          }
        
        case 500:
          return {
            message: 'Internal server error. Please try again later.',
            code: 'INTERNAL_SERVER_ERROR',
            status,
          }
        
        case 502:
        case 503:
        case 504:
          return {
            message: 'Service temporarily unavailable. Please try again later.',
            code: 'SERVICE_UNAVAILABLE',
            status,
          }
        
        default:
          return {
            message: data?.message || `Server error (${status}). Please try again.`,
            code: 'SERVER_ERROR',
            status,
          }
      }
    } else if (request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Please check your connection and try again.',
          code: 'TIMEOUT',
        }
      }
      
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      }
    } else {
      // Error in setting up the request
      return {
        message: error.message || 'Request failed to send.',
        code: 'REQUEST_SETUP_ERROR',
      }
    }
  }

  private static handleGenericError(error: Error): AppError {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'GENERIC_ERROR',
    }
  }

  static getErrorMessage(error: unknown): string {
    return this.handle(error).message
  }

  static isNetworkError(error: unknown): boolean {
    const appError = this.handle(error)
    return appError.code === 'NETWORK_ERROR' || appError.code === 'TIMEOUT'
  }

  static isAuthError(error: unknown): boolean {
    const appError = this.handle(error)
    return appError.code === 'UNAUTHORIZED' || appError.code === 'FORBIDDEN'
  }

  static isValidationError(error: unknown): boolean {
    const appError = this.handle(error)
    return appError.code === 'VALIDATION_ERROR' || appError.code === 'BAD_REQUEST'
  }

  static shouldRetry(error: unknown): boolean {
    const appError = this.handle(error)
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
    ]
    return retryableCodes.includes(appError.code || '')
  }

  static logError(error: unknown, context?: string) {
    const appError = this.handle(error)
    
    console.error('Application Error:', {
      context,
      message: appError.message,
      code: appError.code,
      status: appError.status,
      details: appError.details,
      timestamp: new Date().toISOString(),
    })
    
    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, etc.
  }
}

export default ErrorHandler