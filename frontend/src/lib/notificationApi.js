import { api } from './api.js'

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get('/api/notifications')
    return response.data
  },

  markAsRead: async (id) => {
    await api.put(`/api/notifications/${id}/read`)
  },

  markAllAsRead: async () => {
    await api.put('/api/notifications/read-all')
  }
}
