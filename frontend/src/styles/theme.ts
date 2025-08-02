import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      main: string
    }
  }

  interface PaletteOptions {
    surface?: {
      main?: string
    }
  }

  interface Theme {
    custom: {
      gradients: {
        primary: string
        secondary: string
      }
      shadows: {
        light: string
        medium: string
        heavy: string
      }
    }
  }

  interface ThemeOptions {
    custom?: {
      gradients?: {
        primary?: string
        secondary?: string
      }
      shadows?: {
        light?: string
        medium?: string
        heavy?: string
      }
    }
  }
}

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6', // Blue-500
      light: '#60A5FA', // Blue-400
      dark: '#1E40AF', // Blue-800
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Emerald-500
      light: '#34D399', // Emerald-400
      dark: '#047857', // Emerald-700
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F172A', // Slate-900
      paper: '#1E293B', // Slate-800
    },
    surface: {
      main: '#334155', // Slate-700
    },
    text: {
      primary: '#F8FAFC', // Slate-50
      secondary: '#CBD5E1', // Slate-300
    },
    error: {
      main: '#EF4444', // Red-500
      light: '#F87171', // Red-400
      dark: '#DC2626', // Red-600
    },
    warning: {
      main: '#F59E0B', // Amber-500
      light: '#FBBF24', // Amber-400
      dark: '#D97706', // Amber-600
    },
    info: {
      main: '#06B6D4', // Cyan-500
      light: '#22D3EE', // Cyan-400
      dark: '#0891B2', // Cyan-600
    },
    success: {
      main: '#10B981', // Emerald-500
      light: '#34D399', // Emerald-400
      dark: '#047857', // Emerald-700
    },
    divider: '#475569', // Slate-600
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: '#1E293B',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#334155',
            '& fieldset': {
              borderColor: '#475569',
            },
            '&:hover fieldset': {
              borderColor: '#64748B',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E293B',
          borderRight: '1px solid #334155',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
  custom: {
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      secondary: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    },
    shadows: {
      light: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      heavy: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
})

export default darkTheme