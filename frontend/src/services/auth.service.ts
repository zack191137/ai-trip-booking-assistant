import axios from 'axios';
import type { User, LoginCredentials, RegisterData } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    
    // Backend returns nested data structure: { success: true, data: { user, accessToken } }
    const { data: responseData } = response.data;
    const token = responseData.accessToken;
    const user = responseData.user;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    // Trigger token-updated event for immediate AuthContext update
    window.dispatchEvent(new Event('token-updated'));
    
    return { user, token };
  }

  async loginWithGoogle(googleToken: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
      token: googleToken,
    });
    
    // Backend returns nested data structure: { success: true, data: { user, token } }
    const { data: responseData } = response.data;
    const token = responseData.token;
    const user = responseData.user;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    // Trigger token-updated event for immediate AuthContext update
    window.dispatchEvent(new Event('token-updated'));
    
    return { user, token };
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    
    // Backend returns nested data structure: { success: true, data: { user, accessToken } }
    const { data: responseData } = response.data;
    const token = responseData.accessToken;
    const user = responseData.user;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    return { user, token };
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/profile`);
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.clearAuthHeader();
  }

  isAuthenticated(): boolean {
    // Check both internal token and localStorage to handle external token updates
    const localToken = localStorage.getItem('token');
    if (localToken && !this.token) {
      // Sync internal state with localStorage
      this.token = localToken;
      this.setAuthHeader(localToken);
    }
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export default new AuthService();