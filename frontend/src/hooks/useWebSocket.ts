import { useEffect, useState, useCallback, useRef } from 'react';
import socketClient from '@/services/websocket/socketClient';
import type { Message, Conversation } from '@/types';

interface UseWebSocketOptions {
  conversationId?: string;
  onMessage?: (conversationId: string, data: Message | Conversation) => void;
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

  console.log('🎯 useWebSocket hook called with:', {
    conversationId,
    hasOnMessage: !!onMessage,
    hasOnMessageUpdate: !!onMessageUpdate,
    hasOnConversationUpdate: !!onConversationUpdate,
    hasOnTyping: !!onTyping,
    hasOnError: !!onError,
  });

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

  // Join/leave conversation rooms with debouncing
  useEffect(() => {
    if (!conversationId || !isConnected) {
      console.log(`⏳ Not joining room - conversationId: ${conversationId}, isConnected: ${isConnected}`);
      return;
    }

    // Small delay to prevent rapid room switching
    const timeout = setTimeout(() => {
      console.log(`🔗 Joining conversation room: ${conversationId}`);
      socketClient.joinConversation(conversationId);
    }, 100);
      
    return () => {
      clearTimeout(timeout);
      console.log(`🚪 Leaving conversation room: ${conversationId}`);
      socketClient.leaveConversation(conversationId);
    };
  }, [conversationId, isConnected]);

  // Event listeners with stable references
  const onMessageRef = useRef(onMessage);
  const onMessageUpdateRef = useRef(onMessageUpdate);
  const onConversationUpdateRef = useRef(onConversationUpdate);
  const onTypingRef = useRef(onTyping);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onMessageUpdateRef.current = onMessageUpdate;
    onConversationUpdateRef.current = onConversationUpdate;
    onTypingRef.current = onTyping;
    onErrorRef.current = onError;
  });

  // Event listeners (stable dependencies)
  useEffect(() => {
    console.log('🔧 Setting up WebSocket event listeners');
    const unsubscribers: Array<() => void> = [];

    // Message handler
    const handleMessage = ({ conversationId, message }: { conversationId: string; message: Message | Conversation }) => {
      console.log('🔄 Processing message event in useWebSocket:', {
        receivedConversationId: conversationId,
        currentConversationId: currentConversationRef.current,
        messageType: typeof message,
        messageKeys: message ? Object.keys(message).join(', ') : 'null',
        willProcess: currentConversationRef.current === conversationId
      });
      
      // Only handle messages for the current conversation
      if (currentConversationRef.current === conversationId && onMessageRef.current) {
        console.log('✅ Calling onMessage callback');
        onMessageRef.current(conversationId, message);
      } else if (currentConversationRef.current !== conversationId) {
        console.log('❌ Ignoring message - conversation ID mismatch');
      } else {
        console.log('❌ No onMessage callback available');
      }
    };
    
    unsubscribers.push(socketClient.on('message', handleMessage));
    console.log('✅ Set up message event listener');

    // Message update handler
    const handleMessageUpdate = ({ conversationId, messageId, message }: { conversationId: string; messageId: string; message: Message }) => {
      if (currentConversationRef.current === conversationId && onMessageUpdateRef.current) {
        onMessageUpdateRef.current(conversationId, messageId, message);
      }
    };
    unsubscribers.push(socketClient.on('messageUpdate', handleMessageUpdate));

    // Conversation update handler
    const handleConversationUpdate = ({ conversation }: { conversation: Conversation }) => {
      if (currentConversationRef.current === conversation.id && onConversationUpdateRef.current) {
        onConversationUpdateRef.current(conversation);
      }
    };
    unsubscribers.push(socketClient.on('conversationUpdate', handleConversationUpdate));

    // Typing handler
    const handleTyping = ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (currentConversationRef.current === conversationId && onTypingRef.current) {
        onTypingRef.current(conversationId, userId, isTyping);
      }
    };
    unsubscribers.push(socketClient.on('typing', handleTyping));

    // Error handler
    const handleError = ({ message, code }: { message: string; code?: string }) => {
      if (onErrorRef.current) {
        onErrorRef.current(message, code);
      }
    };
    unsubscribers.push(socketClient.on('error', handleError));

    // Cleanup all listeners
    return () => {
      console.log('🧹 Cleaning up WebSocket event listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []); // Empty dependencies - handlers are stable now


  // Actions
  const sendMessage = useCallback((content: string) => {
    console.log(`📤 useWebSocket sendMessage called:`, {
      conversationId,
      isConnected,
      content: content.substring(0, 50) + '...'
    });
    
    if (!conversationId) {
      console.error('❌ No conversation ID provided');
      return;
    }
    
    if (!isConnected) {
      console.error('❌ WebSocket not connected');
      return;
    }
    
    console.log(`✅ Sending message via socketClient`);
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