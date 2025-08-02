import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { authService } from '@/services/auth'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = authService.getUser()
      if (storedUser) {
        dispatch({ type: 'AUTH_START' })
        try {
          // Verify token is still valid
          const user = await authService.getCurrentUser()
          authService.setUser(user)
          dispatch({ type: 'AUTH_SUCCESS', payload: user })
        } catch (error) {
          // Token invalid, clear stored user
          authService.removeUser()
          dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' })
        }
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authService.login(credentials)
      authService.setUser(response.user)
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      throw error
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authService.register(credentials)
      authService.setUser(response.user)
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      throw error
    }
  }

  const logout = async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      await authService.logout()
      authService.removeUser()
      dispatch({ type: 'AUTH_LOGOUT' })
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      authService.removeUser()
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }

  const googleLogin = async (credential: string) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authService.googleAuth(credential)
      authService.setUser(response.user)
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google login failed'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      throw error
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    googleLogin,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }