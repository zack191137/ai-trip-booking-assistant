import { useContext } from 'react';
import { ErrorContext } from './ErrorContext.context';
import type { ErrorContextType } from './ErrorContext';

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context as ErrorContextType;
};