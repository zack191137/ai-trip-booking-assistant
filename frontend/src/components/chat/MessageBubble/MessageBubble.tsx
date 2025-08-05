import { Box, Typography, Avatar, Paper } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';
import { format } from 'date-fns';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 2,
        maxWidth: '100%',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          flexShrink: 0,
        }}
      >
        {isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
      </Avatar>

      {/* Message Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '70%',
          minWidth: 0, // Allow text to wrap
        }}
      >
        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : '1px solid',
            borderColor: isUser ? 'transparent' : 'divider',
            // Custom bubble shape
            borderTopLeftRadius: isUser ? 16 : 4,
            borderTopRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            // Ensure text wraps properly
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap', // Preserve line breaks
              lineHeight: 1.5,
            }}
          >
            {message.content}
          </Typography>

          {/* Metadata (if any) */}
          {message.metadata?.intent && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                opacity: 0.7,
                fontStyle: 'italic',
              }}
            >
              Intent: {message.metadata.intent}
            </Typography>
          )}
        </Paper>

        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            px: 1,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          {format(message.timestamp, 'h:mm a')}
        </Typography>
      </Box>
    </Box>
  );
};