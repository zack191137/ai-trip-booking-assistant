import React from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material'
import {
  Close,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport,
  Wifi,
  Security,
  Warning,
} from '@mui/icons-material'
import type { AppError } from '@/utils/errorHandler'

interface ErrorAlertProps {
  error: AppError
  onClose?: () => void
  onRetry?: () => void
  showRetry?: boolean
  variant?: 'standard' | 'filled' | 'outlined'
  severity?: 'error' | 'warning' | 'info'
}

export function ErrorAlert({
  error,
  onClose,
  onRetry,
  showRetry = false,
  variant = 'standard',
  severity = 'error',
}: ErrorAlertProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const getErrorIcon = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return <Wifi />
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return <Security />
      case 'VALIDATION_ERROR':
      case 'BAD_REQUEST':
        return <Warning />
      default:
        return <BugReport />
    }
  }

  const getErrorTitle = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem'
      case 'TIMEOUT':
        return 'Request Timeout'
      case 'UNAUTHORIZED':
        return 'Authentication Required'
      case 'FORBIDDEN':
        return 'Access Denied'
      case 'NOT_FOUND':
        return 'Not Found'
      case 'VALIDATION_ERROR':
      case 'BAD_REQUEST':
        return 'Invalid Input'
      case 'RATE_LIMITED':
        return 'Too Many Requests'
      case 'INTERNAL_SERVER_ERROR':
        return 'Server Error'
      case 'SERVICE_UNAVAILABLE':
        return 'Service Unavailable'
      default:
        return 'Error'
    }
  }

  const getSuggestion = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.'
      case 'TIMEOUT':
        return 'The request took too long. Please try again.'
      case 'UNAUTHORIZED':
        return 'Please log in to continue.'
      case 'FORBIDDEN':
        return 'You do not have permission to access this resource.'
      case 'NOT_FOUND':
        return 'The requested resource could not be found.'
      case 'VALIDATION_ERROR':
      case 'BAD_REQUEST':
        return 'Please check your input and try again.'
      case 'RATE_LIMITED':
        return 'Please wait a moment before trying again.'
      case 'INTERNAL_SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        return 'Our servers are experiencing issues. Please try again later.'
      default:
        return 'Please try again or contact support if the problem persists.'
    }
  }

  return (
    <Alert
      severity={severity}
      variant={variant}
      icon={getErrorIcon()}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showRetry && onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<Refresh />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
          
          {(error.details || error.status) && (
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          
          {onClose && (
            <IconButton
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <Close />
            </IconButton>
          )}
        </Box>
      }
    >
      <AlertTitle>{getErrorTitle()}</AlertTitle>
      
      <Typography variant="body2" gutterBottom>
        {error.message}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        {getSuggestion()}
      </Typography>

      {/* Error Details */}
      <Collapse in={showDetails}>
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Technical Details
          </Typography>
          
          {error.code && (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              <strong>Code:</strong> {error.code}
            </Typography>
          )}
          
          {error.status && (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              <strong>Status:</strong> {error.status}
            </Typography>
          )}
          
          {error.details != null && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Details:</strong>
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  p: 1,
                  borderRadius: 0.5,
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {typeof error.details === 'string'
                  ? error.details
                  : JSON.stringify(error.details, null, 2)}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Alert>
  )
}