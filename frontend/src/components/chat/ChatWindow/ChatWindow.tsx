import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { TypingIndicator } from '../TypingIndicator';
import { conversationsService } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Conversation, Message } from '@/types';

interface ChatWindowProps {
  conversationId?: string;
  onConversationChange?: (conversation: Conversation) => void;
}

export const ChatWindow = ({ conversationId, onConversationChange }: ChatWindowProps) => {
  console.log('🏠 ChatWindow rendered with conversationId:', conversationId);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // WebSocket handlers  
  const handleWebSocketMessage = useCallback((_conversationId: string, data: Message | Conversation) => {
    console.log('🔄 ChatWindow handleWebSocketMessage called:', {
      conversationId: _conversationId,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : null,
      rawData: data
    });
    
    // Check if data is a Conversation object (has messages array)
    let message: Message;
    if (data && 'messages' in data && Array.isArray(data.messages)) {
      // Backend sent a Conversation object, extract the latest message
      const conversation = data as Conversation;
      const messages = conversation.messages;
      message = messages[messages.length - 1]; // Get the latest message
      console.log('📦 Extracted message from conversation:', {
        messageRole: message?.role,
        messageContent: message?.content?.substring(0, 50) + '...',
        messageId: message?.id
      });
    } else {
      // Backend sent a Message object directly
      message = data as Message;
      console.log('📨 Direct message received:', {
        messageRole: message?.role,
        messageContent: message?.content?.substring(0, 50) + '...',
        messageId: message?.id
      });
    }
    
    if (!message) {
      console.error('❌ No valid message found in data:', data);
      return;
    }
    
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      // Check both by ID and by content+role combination for temp messages
      const existsById = message.id ? prev.some(m => m.id === message.id) : false;
      const existsByContent = prev.some(m => 
        m.role === message.role && 
        m.content === message.content &&
        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000 // Within 5 seconds
      );
      
      const exists = existsById || existsByContent;
      console.log(`📝 Adding message to state:`, {
        hasID: !!message.id,
        existsById,
        existsByContent,
        exists,
        currentCount: prev.length,
        messageRole: message.role,
        messageContent: message.content.substring(0, 30) + '...'
      });
     
      if (exists) {
        console.log('⚠️ Message already exists, skipping');
        return prev;
      }
      
      const newMessages = [...prev, message];
      console.log(`✅ Message added. New count: ${newMessages.length}`);
      return newMessages;
    });
    setIsTyping(false);
  }, []);

  const handleWebSocketMessageUpdate = useCallback((_conversationId: string, messageId: string, message: Message) => {
    setMessages(prev => prev.map(m => m.id === messageId ? message : m));
  }, []);

  const handleWebSocketConversationUpdate = useCallback((updatedConversation: Conversation) => {
    setConversation(updatedConversation);
    onConversationChange?.(updatedConversation);
  }, [onConversationChange]);

  const handleWebSocketTyping = useCallback((_conversationId: string, userId: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      if (isTyping) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const handleWebSocketError = useCallback((message: string, code?: string) => {
    console.error('WebSocket error:', message, code);
    if (code === 'AUTH_ERROR') {
      setError('Authentication error. Please refresh the page.');
    }
  }, []);

  // Initialize WebSocket with memoized options
  const webSocketOptions = useMemo(() => ({
    conversationId: conversation?.id,
    onMessage: handleWebSocketMessage,
    onMessageUpdate: handleWebSocketMessageUpdate,
    onConversationUpdate: handleWebSocketConversationUpdate,
    onTyping: handleWebSocketTyping,
    onError: handleWebSocketError,
  }), [conversation?.id, handleWebSocketMessage, handleWebSocketMessageUpdate, handleWebSocketConversationUpdate, handleWebSocketTyping, handleWebSocketError]);
  
  const {
    isConnected,
    sendMessage: sendWebSocketMessage,
    sendTyping,
  } = useWebSocket(webSocketOptions);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation when conversationId changes
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    // Always allow initial load, then check for changes
    if (hasInitialized.current && prevConversationIdRef.current === conversationId) {
      console.log('⏭️ Skipping conversation load - same ID');
      return;
    }
    
    hasInitialized.current = true;
    prevConversationIdRef.current = conversationId;
    console.log('🔄 Loading conversation:', conversationId);

    const loadConversation = async () => {
      if (!conversationId) {
        // Create new conversation
        try {
          setIsLoading(true);
          setError(null);
          console.log('🆕 Creating new conversation');
          const newConversation = await conversationsService.createConversation();
          setConversation(newConversation);
          setMessages(newConversation.messages);
          console.log('✅ New conversation created:', newConversation.id);
          onConversationChange?.(newConversation);
        } catch (err) {
          setError('Failed to create conversation. Please try again.');
          console.error('Failed to create conversation:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Load existing conversation
        try {
          setIsLoading(true);
          setError(null);
          console.log('📁 Loading existing conversation:', conversationId);
          const existingConversation = await conversationsService.getConversation(conversationId);
          setConversation(existingConversation);
          setMessages(existingConversation.messages);
          console.log('✅ Existing conversation loaded:', existingConversation.id);
          // Only call onConversationChange if the conversation data is different
          if (conversation?.id !== existingConversation.id) {
            onConversationChange?.(existingConversation);
          }
        } catch (err) {
          setError('Failed to load conversation. Please try again.');
          console.error('Failed to load conversation:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversation();
  }, [conversationId]); // Remove onConversationChange dependency

  // Handle typing indicator
  const handleTypingChange = useCallback((isTyping: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTyping(isTyping);

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  }, [sendTyping]);

  const handleSendMessage = async (content: string) => {
    if (!conversation || !content.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      setIsTyping(true);
      
      // Stop typing indicator
      handleTypingChange(false);

      // If WebSocket is connected, let it handle the message
      if (isConnected) {
        // Don't add optimistic update - let WebSocket handle both user and AI messages
        // This prevents duplicate user messages
        console.log('🚀 Sending message via WebSocket (no optimistic update)');
        sendWebSocketMessage(content.trim());
      } else {
        // Fallback to HTTP API if WebSocket is not connected
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content: content.trim(),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        const { conversation: updatedConversation } = await conversationsService.sendMessage(
          conversation.id,
          content.trim()
        );

        setConversation(updatedConversation);
        setMessages(updatedConversation.messages);
        onConversationChange?.(updatedConversation);
      }

    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Failed to send message:', err);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  if (isLoading && !conversation) {
    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (error && !conversation) {
    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          p: 3,
        }}
      >
        <Typography variant="h6" color="error" align="center" gutterBottom>
          Unable to load chat
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" color="text.primary">
            Trip Planning Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tell me about your dream destination and I'll help you plan the perfect trip
          </Typography>
        </Box>
        
        {/* Connection Status */}
        <Chip
          icon={isConnected ? <Wifi /> : <WifiOff />}
          label={isConnected ? 'Connected' : 'Offline'}
          color={isConnected ? 'success' : 'default'}
          variant="outlined"
          size="small"
          sx={{ ml: 2, flexShrink: 0 }}
        />
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              👋 Welcome! Start by telling me where you'd like to go and when you're planning to travel.
            </Typography>
          </Box>
        ) : (
          <>
            <MessageList messages={messages} />
            {(isTyping || typingUsers.size > 0) && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
          disabled={isSending || isLoading}
          placeholder={isConnected ? "Type your message..." : "Offline - messages will be sent when connected"}
        />
      </Box>
    </Paper>
  );
};