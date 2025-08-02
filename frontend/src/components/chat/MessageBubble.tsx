import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material'
import {
  Person,
  SmartToy,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  Refresh,
} from '@mui/icons-material'
import { Message } from '@/types/chat'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

interface MessageBubbleProps {
  message: Message
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, positive: boolean) => void
}

export function MessageBubble({ message, onCopy, onRegenerate, onFeedback }: MessageBubbleProps) {
  const { user } = useAuth()
  const isUser = message.sender === 'user'
  const isAssistant = message.sender === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    onCopy?.(message.content)
  }

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a')
  }

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
        {isUser ? (
          user?.name?.charAt(0)?.toUpperCase() || <Person />
        ) : (
          <SmartToy />
        )}
      </Avatar>

      {/* Message Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: { xs: '85%', sm: '75%', md: '65%' },
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            ...(isUser && {
              borderBottomRightRadius: 6,
            }),
            ...(!isUser && {
              borderBottomLeftRadius: 6,
            }),
            border: 1,
            borderColor: isUser ? 'primary.main' : 'divider',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {message.content}
          </Typography>

          {/* Metadata */}
          {message.metadata?.suggestions && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {message.metadata.suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: isUser ? 'primary.contrastText' : 'divider',
                    color: isUser ? 'primary.contrastText' : 'text.secondary',
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Timestamp and Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5,
            px: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(message.timestamp)}
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy message">
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopy sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {isAssistant && onRegenerate && (
              <Tooltip title="Regenerate response">
                <IconButton size="small" onClick={() => onRegenerate(message.id)}>
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            {isAssistant && onFeedback && (
              <>
                <Tooltip title="Good response">
                  <IconButton
                    size="small"
                    onClick={() => onFeedback(message.id, true)}
                  >
                    <ThumbUp sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Poor response">
                  <IconButton
                    size="small"
                    onClick={() => onFeedback(message.id, false)}
                  >
                    <ThumbDown sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}