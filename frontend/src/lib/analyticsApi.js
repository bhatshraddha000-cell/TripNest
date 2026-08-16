import { api } from './api.js'

export const analyticsApi = {
  getTravelerAnalytics: async (tripId) => {
    const url = tripId && tripId !== 'all' ? `/api/analytics/dashboard?tripId=${tripId}` : '/api/analytics/dashboard'
    const response = await api.get(url)
    return response.data
  },

  getAdminAnalytics: async () => {
    const response = await api.get('/api/admin/analytics')
    return response.data
  },

  getAdminUsers: async () => {
    const response = await api.get('/api/admin/users')
    return response.data
  },

  getAdminUserDetails: async (id) => {
    const response = await api.get(`/api/admin/users/${id}`)
    return response.data
  },

  getAdminTrips: async () => {
    const response = await api.get('/api/admin/trips')
    return response.data
  },

  getAdminTripDetails: async (id) => {
    const response = await api.get(`/api/admin/trips/${id}`)
    return response.data
  },
}
