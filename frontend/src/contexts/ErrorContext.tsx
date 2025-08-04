import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { ErrorContext } from './ErrorContext.context';

export interface ErrorContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearError: () => void;
}

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider = ({ children }: ErrorProviderProps) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleClose = () => {
    clearError();
  };

  const value: ErrorContextType = {
    showError,
    showSuccess,
    clearError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </ErrorContext.Provider>
  );
};