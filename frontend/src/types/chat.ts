export interface Message {
  id: string
  conversationId: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    thinking?: string
    suggestions?: string[]
    tripData?: unknown
  }
}

export interface Conversation {
  id: string
  userId: string
  title: string
  messages: Message[]
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoading: boolean
  isConnected: boolean
  error: string | null
}

export interface SendMessagePayload {
  conversationId?: string
  content: string
}

export interface SocketEvents {
  'chat:message': (data: SendMessagePayload) => void
  'chat:message:received': (message: Message) => void
  'chat:conversation:created': (conversation: Conversation) => void
  'chat:typing': (data: { conversationId: string; isTyping: boolean }) => void
  'chat:error': (error: { message: string }) => void
}