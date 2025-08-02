import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthPage } from '@/components/auth/AuthPage'
import { HomePage } from '@/pages/HomePage'
import { ChatPage } from '@/pages/ChatPage'
import { TripsPage } from '@/pages/TripsPage'
import { TripDetailsPage } from '@/pages/TripDetailsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { HelpPage } from '@/pages/HelpPage'
import { ErrorFallback } from '@/components/common/ErrorFallback'
import { useAuth } from '@/contexts/AuthContext'

export function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <HomePage />
            </Layout>
          ) : (
            <HomePage />
          )
        }
      />
      
      <Route
        path="/auth"
        element={
          isAuthenticated ? (
            <Navigate to="/chat" replace />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <Layout>
              <TripsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:tripId"
        element={
          <ProtectedRoute>
            <Layout>
              <TripDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <HistoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Layout>
              <HelpPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all route for 404 */}
      <Route
        path="*"
        element={
          <Layout>
            <ErrorFallback
              message="Page not found"
              showDetails={false}
            />
          </Layout>
        }
      />
    </Routes>
  )
}