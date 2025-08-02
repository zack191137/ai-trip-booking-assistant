import React from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  LinearProgress,
  Paper,
} from '@mui/material'

interface LoadingOverlayProps {
  loading: boolean
  message?: string
  variant?: 'circular' | 'linear' | 'backdrop' | 'inline'
  progress?: number
  size?: number
  thickness?: number
  fullHeight?: boolean
}

export function LoadingOverlay({
  loading,
  message,
  variant = 'circular',
  progress,
  size = 40,
  thickness = 4,
  fullHeight = false,
}: LoadingOverlayProps) {
  if (!loading) return null

  const renderCircularProgress = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullHeight && {
          minHeight: '200px',
        }),
      }}
    >
      <CircularProgress
        size={size}
        thickness={thickness}
        {...(progress !== undefined && {
          variant: 'determinate',
          value: progress,
        })}
      />
      {message && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      )}
      {progress !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  )

  const renderLinearProgress = () => (
    <Box sx={{ width: '100%' }}>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {message}
        </Typography>
      )}
      <LinearProgress
        {...(progress !== undefined && {
          variant: 'determinate',
          value: progress,
        })}
      />
      {progress !== undefined && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  )

  const renderBackdrop = () => (
    <Backdrop
      open={loading}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress
        color="inherit"
        size={size}
        thickness={thickness}
        {...(progress !== undefined && {
          variant: 'determinate',
          value: progress,
        })}
      />
      {message && (
        <Typography variant="h6" textAlign="center">
          {message}
        </Typography>
      )}
      {progress !== undefined && (
        <Typography variant="body1">
          {Math.round(progress)}%
        </Typography>
      )}
    </Backdrop>
  )

  const renderInline = () => (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CircularProgress
        size={size}
        thickness={thickness}
        {...(progress !== undefined && {
          variant: 'determinate',
          value: progress,
        })}
      />
      {message && (
        <Typography variant="body1" textAlign="center">
          {message}
        </Typography>
      )}
      {progress !== undefined && (
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% complete
        </Typography>
      )}
    </Paper>
  )

  switch (variant) {
    case 'linear':
      return renderLinearProgress()
    case 'backdrop':
      return renderBackdrop()
    case 'inline':
      return renderInline()
    case 'circular':
    default:
      return renderCircularProgress()
  }
}

// Higher-order component for wrapping components with loading overlay
export function withLoadingOverlay<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Partial<LoadingOverlayProps>
) {
  return function WrappedComponent(props: P & { loading?: boolean }) {
    const { loading = false, ...componentProps } = props
    
    return (
      <Box sx={{ position: 'relative' }}>
        <Component {...(componentProps as P)} />
        <LoadingOverlay loading={loading} {...loadingProps} />
      </Box>
    )
  }
}

export default LoadingOverlay