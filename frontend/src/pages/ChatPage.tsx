import React, { useEffect } from 'react'
import { Box, Typography, Container } from '@mui/material'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ConversationList } from '@/components/chat/ConversationList'
import { useChat } from '@/contexts/ChatContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function ChatPage() {
  const {
    conversations,
    currentConversation,
    isLoading,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    clearError,
  } = useChat()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleSelectConversation = async (conversationId: string) => {
    await selectConversation(conversationId)
  }

  const handleNewConversation = async () => {
    const newConv = await createConversation('New Trip Planning')
    if (newConv) {
      await selectConversation(newConv.id)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversationId)
    }
  }

  if (isLoading && conversations.length === 0) {
    return <LoadingSpinner message="Loading conversations..." fullScreen />
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Conversation Sidebar - Hidden on mobile */}
      <Box
        sx={{
          width: { xs: 0, md: 320 },
          display: { xs: 'none', md: 'block' },
          borderRight: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Conversations
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Typography>
            <Box
              component="button"
              onClick={handleNewConversation}
              sx={{
                background: 'primary.main',
                color: 'primary.contrastText',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                '&:hover': {
                  background: 'primary.dark',
                },
              }}
            >
              +
            </Box>
          </Box>
        </Box>

        {error && (
          <Box sx={{ p: 2 }}>
            <ErrorAlert error={error} onClose={clearError} />
          </Box>
        )}

        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </Box>

      {/* Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatInterface />
      </Box>
    </Box>
  )
}