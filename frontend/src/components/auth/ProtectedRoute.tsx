import React from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}