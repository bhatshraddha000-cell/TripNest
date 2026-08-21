import { api } from './api.js'

export const feedbackApi = {
  getRecentFeedback: async () => {
    const response = await api.get('/api/feedback/recent')
    return response.data
  },

  submitFeedback: async (email, message) => {
    const response = await api.post('/api/feedback', { email, message })
    return response.data
  },
}
