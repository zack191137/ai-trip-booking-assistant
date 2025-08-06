import { io, Socket } from 'socket.io-client';
import type { Message, Conversation } from '@/types';
import authService from '@/services/auth.service';

// WebSocket events
export interface ServerToClientEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  
  // Chat events
  message: (data: { conversationId: string; message: Message }) => void;
  messageUpdate: (data: { conversationId: string; messageId: string; message: Message }) => void;
  conversationUpdate: (data: { conversation: Conversation }) => void;
  typing: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  
  // Error events
  error: (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Chat events
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (data: { conversationId: string; content: string }) => void;
  typing: (data: { conversationId: string; isTyping: boolean }) => void;
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    // Initialize socket when authentication is available
    if (authService.isAuthenticated()) {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://localhost:3000';
    const token = authService.getToken();

    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    console.log('Connecting to WebSocket:', wsUrl);

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.notifyConnectionListeners(false);
      
      // Handle auth-related disconnections
      if (reason === 'io server disconnect') {
        // Server disconnected us, might be auth issue
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      } else {
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      }
    });

    // Error handling
    this.socket.on('error', ({ message, code }) => {
      console.error('WebSocket error:', message, code);
      
      // Handle auth errors
      if (code === 'AUTH_ERROR' || code === 'UNAUTHORIZED') {
        this.disconnect();
        // Could trigger re-authentication flow here
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionListeners(false);
    }
  }

  // Connection status management
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    
    // Immediately notify of current status
    listener(this.isConnected());
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Conversation management
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join conversation');
      return;
    }
    
    this.socket.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot leave conversation');
      return;
    }
    
    this.socket.emit('leaveConversation', conversationId);
  }

  // Message handling
  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('sendMessage', { conversationId, content });
  }

  // Typing indicators
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return; // Silently ignore if not connected
    }
    
    this.socket.emit('typing', { conversationId, isTyping });
  }

  // Event listeners for components
  on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): () => void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return () => {};
    }
    
    // Type assertion is necessary here due to Socket.io's generic event system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket.on(event, listener as any);
    
    // Return unsubscribe function
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket?.off(event, listener as any);
    };
  }

  // Get the underlying socket instance (use carefully)
  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Auto-connect/disconnect based on auth state
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    if (e.newValue) {
      socketClient.connect();
    } else {
      socketClient.disconnect();
    }
  }
});

// Also listen for custom auth events
window.addEventListener('auth-change', () => {
  if (authService.isAuthenticated()) {
    socketClient.connect();
  } else {
    socketClient.disconnect();
  }
});

export default socketClient;