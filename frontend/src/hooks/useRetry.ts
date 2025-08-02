import { useState, useCallback } from 'react'
import { ErrorHandler } from '@/utils/errorHandler'

interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

interface RetryState {
  isRetrying: boolean
  attemptCount: number
  lastError: unknown | null
}

export function useRetry() {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
  })

  const executeWithRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T | null> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      shouldRetry = ErrorHandler.shouldRetry,
    } = options

    setRetryState({
      isRetrying: true,
      attemptCount: 0,
      lastError: null,
    })

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          attemptCount: attempt,
        }))

        const result = await asyncFn()
        
        setRetryState({
          isRetrying: false,
          attemptCount: attempt,
          lastError: null,
        })
        
        return result
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts
        const shouldContinueRetrying = shouldRetry(error, attempt)

        setRetryState(prev => ({
          ...prev,
          lastError: error,
        }))

        if (isLastAttempt || !shouldContinueRetrying) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
          }))
          
          // Log the final error
          ErrorHandler.logError(error, `Failed after ${attempt} attempts`)
          return null
        }

        // Calculate delay based on backoff strategy
        const retryDelay = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
    }))

    return null
  }, [])

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
    })
  }, [])

  return {
    executeWithRetry,
    reset,
    isRetrying: retryState.isRetrying,
    attemptCount: retryState.attemptCount,
    lastError: retryState.lastError,
  }
}

export default useRetry