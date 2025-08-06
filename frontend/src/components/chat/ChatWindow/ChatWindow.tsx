import { useState, useEffect, useRef, useCallback } from 'react';
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
  const handleWebSocketMessage = useCallback((_conversationId: string, message: Message) => {
    console.log('🔄 ChatWindow handleWebSocketMessage called:', {
      conversationId: _conversationId,
      messageRole: message?.role,
      messageContent: message?.content?.substring(0, 50) + '...',
      messageId: message?.id,
      timestamp: message?.timestamp
    });
    
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      // Handle cases where message might not have an ID yet
      const exists = message.id ? prev.some(m => m.id === message.id) : false;
      console.log(`📝 Adding message to state. Has ID: ${!!message.id}, Exists: ${exists}, Current count: ${prev.length}`);
      
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

  // Initialize WebSocket
  const {
    isConnected,
    sendMessage: sendWebSocketMessage,
    sendTyping,
  } = useWebSocket({
    conversationId: conversation?.id,
    onMessage: handleWebSocketMessage,
    onMessageUpdate: handleWebSocketMessageUpdate,
    onConversationUpdate: handleWebSocketConversationUpdate,
    onTyping: handleWebSocketTyping,
    onError: handleWebSocketError,
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation when conversationId changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        // Create new conversation
        try {
          setIsLoading(true);
          setError(null);
          const newConversation = await conversationsService.createConversation();
          setConversation(newConversation);
          setMessages(newConversation.messages);
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
          const existingConversation = await conversationsService.getConversation(conversationId);
          setConversation(existingConversation);
          setMessages(existingConversation.messages);
          onConversationChange?.(existingConversation);
        } catch (err) {
          setError('Failed to load conversation. Please try again.');
          console.error('Failed to load conversation:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversation();
  }, [conversationId, onConversationChange]);

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
        // Still add optimistic UI update
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content: content.trim(),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        
        // WebSocket will handle the actual sending
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