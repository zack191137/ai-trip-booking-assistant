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

/**
 * Root provider component that wraps the entire application
 * with all necessary context providers in the correct order.
 */
export const AppProvider = ({ children }: AppProviderProps) => {
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