import { api } from './api.js'

export const chatApi = {
  getMessages: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/chat`)
    return response.data
  },

  sendMessage: async (tripId, message) => {
    const response = await api.post(`/api/trips/${tripId}/chat`, { message })
    return response.data
  }
}
