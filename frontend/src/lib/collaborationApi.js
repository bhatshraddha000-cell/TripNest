import { api } from './api.js'

export const collaborationApi = {
  searchUsers: async (query) => {
    const response = await api.get('/api/users/search', { params: { query } })
    return response.data
  },

  inviteMember: async (tripId, emailOrUsername) => {
    const response = await api.post(`/api/trips/${tripId}/invite`, { emailOrUsername })
    return response.data
  },

  getTripMembers: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/members`)
    return response.data
  },

  acceptInvitation: async (invitationId) => {
    const response = await api.post(`/api/invitations/${invitationId}/accept`)
    return response.data
  },

  rejectInvitation: async (invitationId) => {
    const response = await api.post(`/api/invitations/${invitationId}/reject`)
    return response.data
  },

  removeMember: async (tripId, userId) => {
    const response = await api.delete(`/api/trips/${tripId}/members/${userId}`)
    return response.data
  },

  getPendingInvitations: async () => {
    const response = await api.get('/api/invitations/pending')
    return response.data
  }
}
