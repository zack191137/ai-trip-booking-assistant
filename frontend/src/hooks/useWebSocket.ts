import { useEffect, useState, useCallback, useRef } from 'react';
import socketClient from '@/services/websocket/socketClient';
import type { Message, Conversation } from '@/types';

interface UseWebSocketOptions {
  conversationId?: string;
  onMessage?: (conversationId: string, message: Message) => void;
  onMessageUpdate?: (conversationId: string, messageId: string, message: Message) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onTyping?: (conversationId: string, userId: string, isTyping: boolean) => void;
  onError?: (message: string, code?: string) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    conversationId,
    onMessage,
    onMessageUpdate,
    onConversationUpdate,
    onTyping,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(socketClient.isConnected());
  const currentConversationRef = useRef<string | undefined>(conversationId);

  // Update ref when conversationId changes
  useEffect(() => {
    currentConversationRef.current = conversationId;
  }, [conversationId]);

  // Connection status
  useEffect(() => {
    const unsubscribe = socketClient.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  // Join/leave conversation rooms
  useEffect(() => {
    if (conversationId && isConnected) {
      socketClient.joinConversation(conversationId);
      
      return () => {
        socketClient.leaveConversation(conversationId);
      };
    }
  }, [conversationId, isConnected]);

  // Event listeners
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    if (onMessage) {
      unsubscribers.push(
        socketClient.on('message', ({ conversationId, message }) => {
          // Only handle messages for the current conversation
          if (currentConversationRef.current === conversationId) {
            onMessage(conversationId, message);
          }
        })
      );
    }

    if (onMessageUpdate) {
      unsubscribers.push(
        socketClient.on('messageUpdate', ({ conversationId, messageId, message }) => {
          if (currentConversationRef.current === conversationId) {
            onMessageUpdate(conversationId, messageId, message);
          }
        })
      );
    }

    if (onConversationUpdate) {
      unsubscribers.push(
        socketClient.on('conversationUpdate', ({ conversation }) => {
          if (currentConversationRef.current === conversation.id) {
            onConversationUpdate(conversation);
          }
        })
      );
    }

    if (onTyping) {
      unsubscribers.push(
        socketClient.on('typing', ({ conversationId, userId, isTyping }) => {
          if (currentConversationRef.current === conversationId) {
            onTyping(conversationId, userId, isTyping);
          }
        })
      );
    }

    if (onError) {
      unsubscribers.push(
        socketClient.on('error', ({ message, code }) => {
          onError(message, code);
        })
      );
    }

    // Cleanup all listeners
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [onMessage, onMessageUpdate, onConversationUpdate, onTyping, onError]);

  // Actions
  const sendMessage = useCallback((content: string) => {
    if (!conversationId) {
      console.error('No conversation ID provided');
      return;
    }
    
    if (!isConnected) {
      console.error('WebSocket not connected');
      return;
    }
    
    socketClient.sendMessage(conversationId, content);
  }, [conversationId, isConnected]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!conversationId) return;
    socketClient.sendTyping(conversationId, isTyping);
  }, [conversationId]);

  const joinConversation = useCallback((newConversationId: string) => {
    socketClient.joinConversation(newConversationId);
  }, []);

  const leaveConversation = useCallback((oldConversationId: string) => {
    socketClient.leaveConversation(oldConversationId);
  }, []);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    joinConversation,
    leaveConversation,
  };
};

// Convenience hook for just connection status
export const useWebSocketConnection = (): boolean => {
  const [isConnected, setIsConnected] = useState(socketClient.isConnected());

  useEffect(() => {
    const unsubscribe = socketClient.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
};