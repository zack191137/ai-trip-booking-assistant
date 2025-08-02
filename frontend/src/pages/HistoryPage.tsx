import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  IconButton,
  Divider,
} from '@mui/material'
import {
  History,
  Chat,
  Flight,
  Delete,
  Visibility,
} from '@mui/icons-material'
import { useChat } from '@/contexts/ChatContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export function HistoryPage() {
  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    deleteConversation,
    clearError,
  } = useChat()
  
  const navigate = useNavigate()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleViewConversation = (conversationId: string) => {
    navigate(`/chat?conversation=${conversationId}`)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      await deleteConversation(conversationId)
    }
  }

  const getConversationSummary = (conversation: any) => {
    if (conversation.messages.length === 0) {
      return 'No messages'
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    const preview = lastMessage.content.substring(0, 100)
    return lastMessage.content.length > 100 ? `${preview}...` : preview
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'archived': return 'default'
      default: return 'default'
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading conversation history..." fullScreen />
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            Conversation History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your past conversations and trip planning sessions
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorAlert error={error} onClose={clearError} />
          </Box>
        )}

        {conversations.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Chat sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversation history
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your past conversations will appear here once you start chatting
            </Typography>
          </Paper>
        ) : (
          <Paper>
            <List>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemIcon sx={{ mt: 1 }}>
                      <Chat color="primary" />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" component="span">
                            {conversation.title}
                          </Typography>
                          <Chip
                            label={conversation.status}
                            color={getStatusColor(conversation.status)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {getConversationSummary(conversation)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Updated {format(new Date(conversation.updatedAt), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <IconButton
                        onClick={() => handleViewConversation(conversation.id)}
                        color="primary"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      
                      <IconButton
                        onClick={() => handleDeleteConversation(conversation.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  
                  {index < conversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  )
}