import axios from 'axios'
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
authApi.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post('/login', credentials)
    return response.data
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await authApi.post('/register', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await authApi.post('/logout')
    localStorage.removeItem('user')
  },

  async getCurrentUser(): Promise<User> {
    const response = await authApi.get('/me')
    return response.data.user
  },

  async googleAuth(credential: string): Promise<AuthResponse> {
    const response = await authApi.post('/google', { credential })
    return response.data
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await authApi.post('/refresh')
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authApi.put('/change-password', {
      currentPassword,
      newPassword,
    })
  },

  async resetPassword(email: string): Promise<void> {
    await authApi.post('/reset-password', { email })
  },

  // Local storage helpers
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user))
  },

  getUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  removeUser(): void {
    localStorage.removeItem('user')
  },
}

export default authService