import axios from 'axios'
import { Conversation, Message } from '@/types/chat'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const chatApi = axios.create({
  baseURL: `${API_BASE_URL}/chat`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await chatApi.get('/conversations')
    return response.data.conversations
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await chatApi.get(`/conversations/${id}`)
    return response.data.conversation
  },

  async createConversation(title?: string): Promise<Conversation> {
    const response = await chatApi.post('/conversations', { title })
    return response.data.conversation
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const response = await chatApi.put(`/conversations/${id}`, updates)
    return response.data.conversation
  },

  async deleteConversation(id: string): Promise<void> {
    await chatApi.delete(`/conversations/${id}`)
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await chatApi.get(`/conversations/${conversationId}/messages`)
    return response.data.messages
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await chatApi.post(`/conversations/${conversationId}/messages`, {
      content,
    })
    return response.data.message
  },

  async regenerateResponse(conversationId: string, messageId: string): Promise<Message> {
    const response = await chatApi.post(`/conversations/${conversationId}/messages/${messageId}/regenerate`)
    return response.data.message
  },

  async archiveConversation(id: string): Promise<void> {
    await chatApi.put(`/conversations/${id}/archive`)
  },

  async unarchiveConversation(id: string): Promise<void> {
    await chatApi.put(`/conversations/${id}/unarchive`)
  },
}

export default chatService