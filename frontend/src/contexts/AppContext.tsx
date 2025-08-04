import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { ErrorProvider } from './ErrorContext';

interface AppProviderProps {
  children: ReactNode;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Debug: Log environment variables in production
console.log('Environment variables:', {
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_ID,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  allEnvVars: import.meta.env
});

/**
 * Root provider component that wraps the entire application
 * with all necessary context providers in the correct order.
 */
export const AppProvider = ({ children }: AppProviderProps) => {
  // If no client ID, render without Google OAuth provider
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.trim() === '') {
    console.warn('⚠️ Google Client ID not found. Google OAuth will be disabled.');
    return (
      <BrowserRouter>
        <ThemeProvider>
          <ErrorProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ErrorProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <ErrorProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ErrorProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
};