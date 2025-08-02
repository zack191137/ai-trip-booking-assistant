import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material'
import {
  Chat,
  MoreVert,
  Delete,
  Archive,
  Unarchive,
  Edit,
} from '@mui/icons-material'
import { Conversation } from '@/types/chat'
import { format } from 'date-fns'

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onArchiveConversation?: (conversationId: string) => void
  onUnarchiveConversation?: (conversationId: string) => void
  onEditConversation?: (conversationId: string, title: string) => void
  showArchived?: boolean
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onArchiveConversation,
  onUnarchiveConversation,
  onEditConversation,
  showArchived = false,
}: ConversationListProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversation: Conversation) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedConversation(conversation)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedConversation(null)
  }

  const handleDelete = () => {
    if (selectedConversation) {
      onDeleteConversation(selectedConversation.id)
    }
    handleMenuClose()
  }

  const handleArchive = () => {
    if (selectedConversation) {
      if (selectedConversation.status === 'archived') {
        onUnarchiveConversation?.(selectedConversation.id)
      } else {
        onArchiveConversation?.(selectedConversation.id)
      }
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    if (selectedConversation && onEditConversation) {
      const newTitle = prompt('Enter new title:', selectedConversation.title)
      if (newTitle && newTitle.trim()) {
        onEditConversation(selectedConversation.id, newTitle.trim())
      }
    }
    handleMenuClose()
  }

  const filteredConversations = conversations.filter(conv => 
    showArchived ? conv.status === 'archived' : conv.status === 'active'
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return format(date, 'h:mm a')
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return format(date, 'EEEE')
    } else {
      return format(date, 'MMM d')
    }
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return 'No messages yet'
    
    const preview = lastMessage.content.substring(0, 60)
    return lastMessage.content.length > 60 ? `${preview}...` : preview
  }

  if (filteredConversations.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
        }}
      >
        <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {showArchived ? 'No archived conversations' : 'No conversations yet'}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {showArchived 
            ? 'Archived conversations will appear here'
            : 'Start a new conversation to begin planning your trip'
          }
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <List sx={{ p: 0 }}>
        {filteredConversations.map((conversation) => (
          <ListItem key={conversation.id} disablePadding>
            <ListItemButton
              selected={conversation.id === currentConversationId}
              onClick={() => onSelectConversation(conversation.id)}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Chat
                  sx={{
                    color: conversation.id === currentConversationId
                      ? 'primary.contrastText'
                      : 'text.secondary',
                  }}
                />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        flexGrow: 1,
                        fontWeight: conversation.id === currentConversationId ? 600 : 400,
                      }}
                    >
                      {conversation.title}
                    </Typography>
                    {conversation.status === 'archived' && (
                      <Chip
                        size="small"
                        label="Archived"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      color={
                        conversation.id === currentConversationId
                          ? 'primary.contrastText'
                          : 'text.secondary'
                      }
                      noWrap
                      sx={{ maxWidth: '60%' }}
                    >
                      {getLastMessage(conversation)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        conversation.id === currentConversationId
                          ? 'primary.contrastText'
                          : 'text.secondary'
                      }
                    >
                      {formatDate(conversation.updatedAt)}
                    </Typography>
                  </Box>
                }
              />
              
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, conversation)}
                sx={{
                  color: conversation.id === currentConversationId
                    ? 'primary.contrastText'
                    : 'text.secondary',
                }}
              >
                <MoreVert />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onEditConversation && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 2 }} />
            Rename
          </MenuItem>
        )}
        
        {(onArchiveConversation || onUnarchiveConversation) && (
          <MenuItem onClick={handleArchive}>
            {selectedConversation?.status === 'archived' ? (
              <>
                <Unarchive sx={{ mr: 2 }} />
                Unarchive
              </>
            ) : (
              <>
                <Archive sx={{ mr: 2 }} />
                Archive
              </>
            )}
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  )
}