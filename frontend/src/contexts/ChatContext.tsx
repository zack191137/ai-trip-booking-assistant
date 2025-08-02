import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Conversation, Message, ChatState, SendMessagePayload } from '@/types/chat'
import { chatService } from '@/services/chat'
import { socketService } from '@/services/socket'
import { useAuth } from './AuthContext'

interface ChatContextType extends ChatState {
  sendMessage: (payload: SendMessagePayload) => void
  createConversation: (title?: string) => Promise<Conversation>
  selectConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  clearError: () => void
  loadConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'REMOVE_CONVERSATION'; payload: string }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isConnected: false,
  error: null,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload, isLoading: false }
    
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        isLoading: false,
      }
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
        currentConversation:
          state.currentConversation?.id === action.payload.id
            ? action.payload
            : state.currentConversation,
      }
    
    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        currentConversation:
          state.currentConversation?.id === action.payload
            ? null
            : state.currentConversation,
      }
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload, isLoading: false }
    
    case 'ADD_MESSAGE': {
      const updatedConv = state.currentConversation
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, action.payload],
            updatedAt: action.payload.timestamp,
          }
        : null
      
      return {
        ...state,
        currentConversation: updatedConv,
        conversations: updatedConv
          ? state.conversations.map(conv =>
              conv.id === updatedConv.id ? updatedConv : conv
            )
          : state.conversations,
      }
    }
    
    case 'UPDATE_MESSAGE': {
      const updatedConvWithMessage = state.currentConversation
        ? {
            ...state.currentConversation,
            messages: state.currentConversation.messages.map(msg =>
              msg.id === action.payload.id ? action.payload : msg
            ),
          }
        : null
      
      return {
        ...state,
        currentConversation: updatedConvWithMessage,
        conversations: updatedConvWithMessage
          ? state.conversations.map(conv =>
              conv.id === updatedConvWithMessage.id ? updatedConvWithMessage : conv
            )
          : state.conversations,
      }
    }
    
    default:
      return state
  }
}

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { user, isAuthenticated } = useAuth()

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect()
        .then(() => {
          dispatch({ type: 'SET_CONNECTED', payload: true })
        })
        .catch((error) => {
          console.error('Failed to connect to WebSocket:', error)
          dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to chat service' })
        })

      // Set up socket event listeners
      socketService.on('chat:message:received', (message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message })
      })

      socketService.on('chat:conversation:created', (conversation: Conversation) => {
        dispatch({ type: 'ADD_CONVERSATION', payload: conversation })
      })

      socketService.on('chat:error', (error: { message: string }) => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      })

      return () => {
        socketService.disconnect()
        dispatch({ type: 'SET_CONNECTED', payload: false })
      }
    }
  }, [isAuthenticated, user])

  const loadConversations = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const conversations = await chatService.getConversations()
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations })
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? // @ts-expect-error: error might have response property
            error.response?.data?.message || 'Failed to load conversations'
          : 'Failed to load conversations'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }

  const createConversation = async (title?: string): Promise<Conversation> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const conversation = await chatService.createConversation(title)
      dispatch({ type: 'ADD_CONVERSATION', payload: conversation })
      return conversation
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'Failed to create conversation'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }

  const selectConversation = async (conversationId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const conversation = await chatService.getConversation(conversationId)
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation })
    } catch (error: unknown) {
      let errorMessage = 'Failed to load conversation'
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
      ) {
        errorMessage = (error as { response?: { data?: { message?: string } } }).response!.data!.message!
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await chatService.deleteConversation(conversationId)
      dispatch({ type: 'REMOVE_CONVERSATION', payload: conversationId })
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : 'Failed to delete conversation'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }

  const sendMessage = (payload: SendMessagePayload) => {
    if (socketService.isConnected()) {
      socketService.emit('chat:message', payload)
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'Not connected to chat service' })
    }
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const value: ChatContextType = {
    ...state,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    clearError,
    loadConversations,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export { ChatContext }