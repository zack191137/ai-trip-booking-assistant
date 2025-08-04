import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AuthContext } from './AuthContext.context';
import authService from '@/services/auth.service';
import type { User, LoginCredentials, RegisterData } from '@/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}


interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] checkAuth called, isAuthenticated:', authService.isAuthenticated());
      try {
        if (authService.isAuthenticated()) {
          try {
            const currentUser = await authService.getCurrentUser();
            console.log('[AuthContext] Setting user:', currentUser);
            setUser(currentUser);
          } catch (userError: any) {
            console.warn('[AuthContext] Failed to fetch current user, but token exists:', userError.message);
            // If we have a token but can't fetch user (e.g., backend unavailable),
            // create a minimal user object to maintain authenticated state
            if (userError.response?.status === 401) {
              // Token is invalid, clear it
              console.log('[AuthContext] Token invalid (401), clearing auth');
              authService.logout();
              setUser(null);
            } else {
              // Backend unavailable or other error, maintain auth state with minimal user
              console.log('[AuthContext] Backend unavailable, maintaining auth state with placeholder user');
              setUser({
                id: 'unknown',
                email: 'user@example.com',
                name: 'Authenticated User',
                avatar: null
              });
            }
          }
        } else {
          console.log('[AuthContext] Not authenticated, clearing user');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Unexpected error in checkAuth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Check auth on mount
    console.log('[AuthContext] Initial auth check');
    checkAuth();

    // Listen for storage changes (for OAuth popup completion)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('[AuthContext] Storage event received:', e.key, e.newValue ? 'token present' : 'token removed');
      if (e.key === 'token') {
        checkAuth();
      }
    };

    // Listen for custom auth events (for same-window OAuth)
    const handleAuthChange = () => {
      console.log('[AuthContext] Auth-change event received');
      checkAuth();
    };

    // Also listen for a custom token-updated event for immediate updates
    const handleTokenUpdate = () => {
      console.log('[AuthContext] Token-updated event received');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('token-updated', handleTokenUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('token-updated', handleTokenUpdate);
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const { user } = await authService.loginWithGoogle(tokenResponse.access_token);
        setUser(user);
        // Trigger auth change event for immediate state update
        window.dispatchEvent(new Event('auth-change'));
      } catch (error) {
        console.error('Google login failed:', error);
        setIsLoading(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setIsLoading(false);
    },
  });

  const loginWithGoogle = async (): Promise<void> => {
    googleLogin();
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const { user } = await authService.register(data);
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

