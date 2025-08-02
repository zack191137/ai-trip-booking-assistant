import React from 'react'
import {
  Button,
  CircularProgress,
  Box,
} from '@mui/material'
import type { ButtonProps } from '@mui/material'

interface LoadingButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  loading?: boolean
  loadingText?: string
  loadingPosition?: 'start' | 'end' | 'center'
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  spinnerSize?: number
}

export function LoadingButton({
  loading = false,
  loadingText,
  loadingPosition = 'start',
  startIcon,
  endIcon,
  spinnerSize = 16,
  children,
  disabled,
  ...buttonProps
}: LoadingButtonProps) {
  const spinner = (
    <CircularProgress
      size={spinnerSize}
      color="inherit"
      sx={{
        ...(loadingPosition === 'center' && {
          position: 'absolute',
        }),
      }}
    />
  )

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return spinner
    }
    return startIcon
  }

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return spinner
    }
    return endIcon
  }

  const getButtonContent = () => {
    if (loading && loadingPosition === 'center') {
      return (
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              visibility: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {loadingText || children}
          </Box>
          {spinner}
        </Box>
      )
    }

    if (loading && loadingText) {
      return loadingText
    }

    return children
  }

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      startIcon={getStartIcon()}
      endIcon={getEndIcon()}
    >
      {getButtonContent()}
    </Button>
  )
}

export default LoadingButton