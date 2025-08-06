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

    // Prevent multiple connection attempts
    if (this.socket && this.socket.connecting) {
      console.log('Socket connection already in progress');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://localhost:3000';
    const token = authService.getToken();

    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    // Clean up existing socket before creating new one
    if (this.socket) {
      console.log('Cleaning up existing socket before reconnecting');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('Connecting to WebSocket:', wsUrl);

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // Disable automatic reconnection to prevent loops
      timeout: 20000,
      autoConnect: false, // Don't auto-connect, we'll connect manually
    });
    
    // Setup event listeners before connecting
    this.setupEventListeners();
    
    // Connect manually after setup
    this.socket.connect();
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
        // Server forcefully disconnected us (likely auth failure)
        // Socket.io will handle reconnection automatically if configured
        console.warn('Server disconnected the socket:', reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.notifyConnectionListeners(false);
      } else {
        // Manual reconnection with exponential backoff
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);
        console.log(`Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          if (authService.isAuthenticated() && !this.socket?.connected && !this.socket?.connecting) {
            console.log('Attempting manual reconnection...');
            this.connect();
          }
        }, delay);
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
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionListeners(false);
      
      // Reset connection state
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
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
    console.log(`🔗 socketClient.joinConversation called:`, {
      conversationId,
      connected: this.socket?.connected
    });
    
    if (!this.socket?.connected) {
      console.warn('❌ Socket not connected, cannot join conversation');
      return;
    }
    
    console.log(`🚀 Emitting joinConversation event for: ${conversationId}`);
    this.socket.emit('joinConversation', conversationId);
    console.log(`✅ joinConversation event emitted`);
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
    console.log(`📤 socketClient.sendMessage called:`, {
      conversationId,
      content: content.substring(0, 50) + '...',
      connected: this.socket?.connected
    });
    
    if (!this.socket?.connected) {
      console.error('❌ WebSocket not connected in socketClient.sendMessage');
      throw new Error('WebSocket not connected');
    }
    
    const messageData = { 
      conversationId, 
      content,
      timestamp: new Date()
    };
    
    console.log('🚀 Emitting sendMessage event with data:', messageData);
    this.socket.emit('sendMessage', messageData);
    console.log('✅ sendMessage event emitted');
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
    
    console.log(`🎧 Setting up listener for event: ${event}`);
    
    // Wrap listener to add logging
    const wrappedListener = ((...args: any[]) => {
      console.log(`📨 Received WebSocket event: ${event}`, args);
      (listener as any)(...args);
    }) as any;
    
    this.socket.on(event, wrappedListener);
    
    // Return unsubscribe function
    return () => {
      console.log(`🚫 Removing listener for event: ${event}`);
      this.socket?.off(event, wrappedListener);
    };
  }

  // Get the underlying socket instance (use carefully)
  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Debounce helper to prevent rapid reconnection attempts
let authChangeTimeout: NodeJS.Timeout | null = null;
const handleAuthChange = (shouldConnect: boolean) => {
  if (authChangeTimeout) {
    clearTimeout(authChangeTimeout);
  }
  
  authChangeTimeout = setTimeout(() => {
    if (shouldConnect && authService.isAuthenticated()) {
      socketClient.connect();
    } else if (!shouldConnect) {
      socketClient.disconnect();
    }
  }, 100); // Small delay to debounce rapid changes
};

// Auto-connect/disconnect based on auth state
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    handleAuthChange(!!e.newValue);
  }
});

// Also listen for custom auth events
window.addEventListener('auth-change', () => {
  handleAuthChange(authService.isAuthenticated());
});

export default socketClient;