import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
} from '@mui/material'
import {
  Send,
  AttachFile,
  Mic,
  Stop,
} from '@mui/icons-material'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
  suggestions?: string[]
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message here...",
  suggestions = [],
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textFieldRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    textFieldRef.current?.focus()
  }

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      // TODO: Implement voice recording stop logic
    } else {
      // Start recording
      setIsRecording(true)
      // TODO: Implement voice recording start logic
    }
  }

  const canSend = message.trim().length > 0 && !disabled

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Suggestions:
          </Typography>
          {suggestions.map((suggestion, index) => (
            <Chip
              key={index}
              label={suggestion}
              size="small"
              variant="outlined"
              clickable
              onClick={() => handleSuggestionClick(suggestion)}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Input Area */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          p: 1,
          gap: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        {/* Attachment Button */}
        <IconButton
          size="small"
          disabled={disabled}
          sx={{ alignSelf: 'flex-end', mb: 0.5 }}
        >
          <AttachFile />
        </IconButton>

        {/* Text Input */}
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
          sx={{
            '& .MuiInputBase-input': {
              padding: '8px 0',
              fontSize: '0.95rem',
            },
          }}
        />

        {/* Voice Recording Button */}
        <IconButton
          size="small"
          onClick={handleVoiceRecord}
          disabled={disabled}
          color={isRecording ? 'error' : 'default'}
          sx={{ alignSelf: 'flex-end', mb: 0.5 }}
        >
          {isRecording ? <Stop /> : <Mic />}
        </IconButton>

        {/* Send Button */}
        <IconButton
          onClick={handleSubmit}
          disabled={!canSend}
          color="primary"
          sx={{
            alignSelf: 'flex-end',
            mb: 0.5,
            '&.Mui-disabled': {
              color: 'text.disabled',
            },
          }}
        >
          <Send />
        </IconButton>
      </Paper>

      {/* Character Count */}
      {message.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
        >
          {message.length} characters
        </Typography>
      )}
    </Box>
  )
}