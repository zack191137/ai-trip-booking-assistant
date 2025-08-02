import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Typography,
  Alert,
  Fab,
  Snackbar,
  Paper,
} from '@mui/material'
import {
  KeyboardArrowDown,
} from '@mui/icons-material'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useChat } from '@/contexts/ChatContext'
import { chatService } from '@/services/chat'

const WELCOME_SUGGESTIONS = [
  "I want to plan a trip to Japan",
  "Find me flights to New York",
  "Recommend hotels in Paris",
  "Plan a weekend getaway",
  "I need help with my travel budget",
]

export function ChatInterface() {
  const {
    currentConversation,
    isLoading,
    isConnected,
    error,
    sendMessage,
    clearError,
  } = useChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [copySnackbar, setCopySnackbar] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  // Handle scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (content: string) => {
    if (!currentConversation) {
      // Create new conversation if none exists
      sendMessage({ content })
    } else {
      sendMessage({
        conversationId: currentConversation.id,
        content,
      })
    }
  }

  const handleCopyMessage = () => {
    setCopySnackbar(true)
  }

  const handleRegenerateMessage = async (messageId: string) => {
    if (!currentConversation) return
    
    try {
      await chatService.regenerateResponse(currentConversation.id, messageId)
    } catch (error) {
      console.error('Failed to regenerate message:', error)
    }
  }

  const handleMessageFeedback = async (messageId: string, positive: boolean) => {
    // TODO: Implement feedback API
    console.log('Message feedback:', messageId, positive)
  }

  if (!isConnected) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3,
        }}
      >
        <LoadingSpinner message="Connecting to chat service..." />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ m: 2, mb: 0 }}
        >
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!currentConversation ? (
          // Welcome Screen
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome to Trip Booking Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              I'm here to help you plan your perfect trip. Tell me where you'd like to go!
            </Typography>
          </Box>
        ) : (
          // Messages
          <>
            {currentConversation.messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {currentConversation.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start the conversation by asking about your travel plans
                </Typography>
              </Box>
            ) : (
              currentConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                  onRegenerate={handleRegenerateMessage}
                  onFeedback={handleMessageFeedback}
                />
              ))
            )}
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <LoadingSpinner message="AI is thinking..." size={24} />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Fab
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            bottom: 100,
            right: 24,
            zIndex: 1,
          }}
          onClick={scrollToBottom}
        >
          <KeyboardArrowDown />
        </Fab>
      )}

      {/* Message Input */}
      <Paper elevation={3}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading || !isConnected}
          suggestions={!currentConversation?.messages?.length ? WELCOME_SUGGESTIONS : []}
        />
      </Paper>

      {/* Copy Snackbar */}
      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)}
        message="Message copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}