import React, { createContext, useContext, useReducer, ReactNode } from 'react'

interface AppState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  language: string
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    email: boolean
  }
  preferences: {
    currency: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    units: 'metric' | 'imperial'
  }
}

interface AppContextType extends AppState {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: string) => void
  updateNotificationSettings: (settings: Partial<AppState['notifications']>) => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  resetSettings: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

type AppAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<AppState['notifications']> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppState['preferences']> }
  | { type: 'RESET_SETTINGS' }

const initialState: AppState = {
  sidebarOpen: false,
  theme: 'dark',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
  },
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    units: 'imperial',
  },
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload }
    
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload },
      }
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      }
    
    case 'RESET_SETTINGS':
      return initialState
    
    default:
      return state
  }
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        Object.keys(settings).forEach(key => {
          switch (key) {
            case 'theme':
              dispatch({ type: 'SET_THEME', payload: settings[key] })
              break
            case 'language':
              dispatch({ type: 'SET_LANGUAGE', payload: settings[key] })
              break
            case 'notifications':
              dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: settings[key] })
              break
            case 'preferences':
              dispatch({ type: 'UPDATE_PREFERENCES', payload: settings[key] })
              break
          }
        })
      } catch (error) {
        console.error('Failed to load app settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  React.useEffect(() => {
    const settings = {
      theme: state.theme,
      language: state.language,
      notifications: state.notifications,
      preferences: state.preferences,
    }
    localStorage.setItem('appSettings', JSON.stringify(settings))
  }, [state.theme, state.language, state.notifications, state.preferences])

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open })
  }

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  const setLanguage = (language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }

  const updateNotificationSettings = (settings: Partial<AppState['notifications']>) => {
    dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: settings })
  }

  const updatePreferences = (preferences: Partial<AppState['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' })
    localStorage.removeItem('appSettings')
  }

  const value: AppContextType = {
    ...state,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    setLanguage,
    updateNotificationSettings,
    updatePreferences,
    resetSettings,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export { AppContext }