import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { TypingIndicator } from '../TypingIndicator';
import { conversationsService } from '@/services/api';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (content: string) => {
    if (!conversation || !content.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      setIsTyping(true);

      // Optimistically add user message to UI
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send message to backend
      const { conversation: updatedConversation } = await conversationsService.sendMessage(
        conversation.id,
        content.trim()
      );

      // Update conversation and messages with backend response
      setConversation(updatedConversation);
      setMessages(updatedConversation.messages);
      onConversationChange?.(updatedConversation);

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
        }}
      >
        <Typography variant="h6" color="text.primary">
          Trip Planning Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tell me about your dream destination and I'll help you plan the perfect trip
        </Typography>
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
            {isTyping && <TypingIndicator />}
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
          disabled={isSending || isLoading}
          placeholder="Type your message..."
        />
      </Box>
    </Paper>
  );
};