import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.context';
import type { ThemeContextType } from './ThemeContext';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context as ThemeContextType;
};