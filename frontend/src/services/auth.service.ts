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
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, credentials);
    const { token } = response.data;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    // Trigger token-updated event for immediate AuthContext update
    window.dispatchEvent(new Event('token-updated'));
    
    return response.data;
  }

  async loginWithGoogle(googleToken: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/google`, {
      token: googleToken,
    });
    const { token } = response.data;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    // Trigger token-updated event for immediate AuthContext update
    window.dispatchEvent(new Event('token-updated'));
    
    return response.data;
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, data);
    const { token } = response.data;
    
    this.token = token;
    localStorage.setItem('token', token);
    this.setAuthHeader(token);
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`);
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