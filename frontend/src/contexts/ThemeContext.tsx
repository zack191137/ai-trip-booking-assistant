import { useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext.context';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from '@/styles/theme';

type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}


interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Default to dark mode as specified in requirements
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    mode,
    toggleMode,
    setMode: handleSetMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

