import { Box, Typography, Divider } from '@mui/material';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    );
  }

  // Group messages by date for date separators
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  
  messages.forEach((message) => {
    const messageDate = message.timestamp;
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    
    if (!lastGroup || !isSameDay(lastGroup.date, messageDate)) {
      groupedMessages.push({
        date: messageDate,
        messages: [message],
      });
    } else {
      lastGroup.messages.push(message);
    }
  });

  const formatDateSeparator = (date: Date): string => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {groupedMessages.map((group, groupIndex) => (
        <Box key={groupIndex}>
          {/* Date Separator */}
          {groupedMessages.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
              <Divider sx={{ flexGrow: 1 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  fontWeight: 500,
                }}
              >
                {formatDateSeparator(group.date)}
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>
          )}

          {/* Messages for this date */}
          {group.messages.map((message, messageIndex) => (
            <MessageBubble
              key={message.id || `${groupIndex}-${messageIndex}`}
              message={message}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};