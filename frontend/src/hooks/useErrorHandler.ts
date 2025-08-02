import { useState, useCallback } from 'react'
import { ErrorHandler, AppError } from '@/utils/errorHandler'

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: unknown, context?: string) => {
    const appError = ErrorHandler.handle(error)
    setError(appError)
    ErrorHandler.logError(error, context)
    return appError
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    options?: {
      loadingState?: boolean
      clearPreviousError?: boolean
    }
  ): Promise<T | null> => {
    const { loadingState = true, clearPreviousError = true } = options || {}
    
    if (clearPreviousError) {
      setError(null)
    }
    
    if (loadingState) {
      setIsLoading(true)
    }

    try {
      const result = await asyncFn()
      return result
    } catch (err) {
      handleError(err, context)
      return null
    } finally {
      if (loadingState) {
        setIsLoading(false)
      }
    }
  }, [handleError])

  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          clearError()
        }
        
        const result = await asyncFn()
        return result
      } catch (err) {
        ErrorHandler.handle(err)
        
        if (attempt === maxAttempts || !ErrorHandler.shouldRetry(err)) {
          handleError(err, `${context} (attempt ${attempt}/${maxAttempts})`)
          break
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    return null
  }, [handleError, clearError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
    retry,
  }
}

export default useErrorHandler