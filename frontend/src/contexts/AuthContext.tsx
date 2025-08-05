import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AuthContext } from './AuthContext.context';
import authService from '@/services/auth.service';
import type { User, LoginCredentials, RegisterData } from '@/types';

// Error type for API responses
interface ApiError {
  response?: {
    status: number;
  };
}

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
      try {
        if (authService.isAuthenticated()) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (userError) {
            // If we have a token but can't fetch user (e.g., backend unavailable),
            // create a minimal user object to maintain authenticated state
            if ((userError as ApiError).response?.status === 401) {
              // Token is invalid, clear it
              authService.logout();
              setUser(null);
            } else {
              // Backend unavailable or other error, maintain auth state with minimal user
              setUser({
                id: 'unknown',
                email: 'user@example.com',
                name: 'Authenticated User',
                avatar: undefined
              });
            }
          }
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (for OAuth popup completion)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth();
      }
    };

    // Listen for custom auth events (for same-window OAuth)
    const handleAuthChange = () => {
      checkAuth();
    };

    // Also listen for a custom token-updated event for immediate updates
    const handleTokenUpdate = () => {
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
        setIsLoading(false);
        // Trigger auth change event for immediate state update
        window.dispatchEvent(new Event('auth-change'));
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    onError: () => {
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

