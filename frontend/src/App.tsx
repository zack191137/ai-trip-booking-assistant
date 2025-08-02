import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { darkTheme } from '@/styles/theme'
import { AppProvider } from '@/contexts/AppContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { TripProvider } from '@/contexts/TripContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppRoutes } from '@/routes/AppRoutes'
import '@/styles/global.css'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ErrorProvider>
            <AppProvider>
              <AuthProvider>
                <TripProvider>
                  <ChatProvider>
                    <AppRoutes />
                  </ChatProvider>
                </TripProvider>
              </AuthProvider>
            </AppProvider>
          </ErrorProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
