import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Root provider component that wraps the entire application
 * with all necessary context providers in the correct order.
 */
export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};