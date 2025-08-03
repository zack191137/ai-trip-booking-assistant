import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext.context';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}


interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock authentication for development
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // For now, set a mock user for development
      setUser({
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login logic
      console.log('Login attempt:', credentials);
      
      // Mock successful login
      setUser({
        id: '1',
        email: credentials.email,
        name: 'Demo User',
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement Google OAuth login
      console.log('Google login attempt');
      
      // Mock successful Google login
      setUser({
        id: '1',
        email: 'demo@gmail.com',
        name: 'Demo User',
      });
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic
      console.log('Register attempt:', data);
      
      // Mock successful registration
      setUser({
        id: '1',
        email: data.email,
        name: data.name,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    // TODO: Clear tokens, redirect, etc.
    console.log('User logged out');
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

