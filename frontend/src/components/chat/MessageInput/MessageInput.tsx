import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const MessageInput = ({
  onSendMessage,
  onTypingChange,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 2000,
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) return;

    try {
      setIsSending(true);
      
      // Stop typing indicator
      if (onTypingChange) {
        onTypingChange(false);
      }
      
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Focus back on input after sending
      setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue.length <= maxLength) {
      const wasEmpty = message.length === 0;
      setMessage(newValue);
      
      // Trigger typing indicator
      if (onTypingChange) {
        const isNowEmpty = newValue.length === 0;
        if (wasEmpty && !isNowEmpty) {
          // Started typing
          onTypingChange(true);
        } else if (!wasEmpty && isNowEmpty) {
          // Stopped typing (cleared input)
          onTypingChange(false);
        }
      }
    }
  };

  const canSend = message.trim().length > 0 && !disabled && !isSending;
  const showCharCount = message.length > maxLength * 0.8; // Show count when approaching limit

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.default',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Attach file (coming soon)">
                  <span>
                    <IconButton
                      size="small"
                      disabled={true} // TODO: Implement file attachment
                      sx={{ mr: 0.5 }}
                    >
                      <AttachFile fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title={canSend ? "Send message" : "Enter a message to send"}>
          <span>
            <IconButton
              onClick={handleSend}
              disabled={!canSend}
              color="primary"
              sx={{
                bgcolor: canSend ? 'primary.main' : 'action.disabled',
                color: canSend ? 'primary.contrastText' : 'action.disabled',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: canSend ? 'primary.dark' : 'action.disabled',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabled',
                  color: 'action.disabled',
                },
              }}
            >
              {isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Character count */}
      {showCharCount && (
        <Box sx={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: message.length >= maxLength ? 'error.main' : 'text.secondary',
            }}
          >
            {message.length}/{maxLength}
          </span>
        </Box>
      )}

      {/* Keyboard shortcut hint */}
      <Box sx={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'text.disabled',
          }}
        >
          Press Enter to send, Shift+Enter for new line
        </span>
      </Box>
    </Box>
  );
};