import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { ErrorHandler, AppError } from '@/utils/errorHandler'

interface ErrorContextType {
  showError: (error: unknown, context?: string) => void
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  clearNotification: () => void
}

interface Notification {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  duration?: number
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showError = useCallback((error: unknown, context?: string) => {
    const appError = ErrorHandler.handle(error)
    ErrorHandler.logError(error, context)
    
    setNotification({
      type: 'error',
      message: appError.message,
      duration: 6000,
    })
  }, [])

  const showSuccess = useCallback((message: string) => {
    setNotification({
      type: 'success',
      message,
      duration: 4000,
    })
  }, [])

  const showWarning = useCallback((message: string) => {
    setNotification({
      type: 'warning',
      message,
      duration: 5000,
    })
  }, [])

  const showInfo = useCallback((message: string) => {
    setNotification({
      type: 'info',
      message,
      duration: 4000,
    })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    clearNotification()
  }

  const value: ErrorContextType = {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearNotification,
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
      
      {/* Global notification snackbar */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={notification?.duration || 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert
            onClose={handleClose}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </ErrorContext.Provider>
  )
}

export function useErrorNotification() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrorNotification must be used within an ErrorProvider')
  }
  return context
}

// Hook that combines error handling with notifications
export function useErrorWithNotification() {
  const { showError, showSuccess, showWarning, showInfo } = useErrorNotification()
  const [isLoading, setIsLoading] = useState(false)

  const executeWithNotification = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      context?: string
      successMessage?: string
      loadingState?: boolean
    }
  ): Promise<T | null> => {
    const { context, successMessage, loadingState = true } = options || {}
    
    if (loadingState) {
      setIsLoading(true)
    }

    try {
      const result = await asyncFn()
      
      if (successMessage) {
        showSuccess(successMessage)
      }
      
      return result
    } catch (error) {
      showError(error, context)
      return null
    } finally {
      if (loadingState) {
        setIsLoading(false)
      }
    }
  }, [showError, showSuccess])

  return {
    executeWithNotification,
    isLoading,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  }
}

export { ErrorContext }