import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
} from '@mui/material'
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  message?: string
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  message = 'Something went wrong',
  showDetails = false,
}: ErrorFallbackProps) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleReportBug = () => {
    // In a real app, this would open a bug report form or external service
    const subject = encodeURIComponent('Bug Report: Application Error')
    const body = encodeURIComponent(`
Error Message: ${error?.message || 'Unknown error'}
Stack Trace: ${error?.stack || 'Not available'}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
    `)
    
    window.open(`mailto:support@tripbookingassistant.com?subject=${subject}&body=${body}`)
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <ErrorOutline
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />
            
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {message}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              We apologize for the inconvenience. Our team has been notified about this issue.
            </Typography>

            {showDetails && error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'error.light',
                  borderRadius: 1,
                  textAlign: 'left',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                  {error.stack && `\n\nStack Trace:\n${error.stack}`}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 4 }} justifyContent="center">
              {resetError && (
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={resetError}
                >
                  Try Again
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReload}
              >
                Reload Page
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={handleGoHome}
              >
                Go Home
              </Button>
            </Stack>

            <Button
              variant="text"
              size="small"
              startIcon={<BugReport />}
              onClick={handleReportBug}
              sx={{ mt: 2 }}
            >
              Report Bug
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

// Remove withErrorFallback from this file to fix Fast Refresh error.
// Please import withErrorFallback from './withErrorFallback' instead.