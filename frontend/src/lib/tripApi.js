import { api } from './api.js'

export const tripApi = {
  getAllTrips: async () => {
    const response = await api.get('/api/trips')
    return response.data
  },

  getTrip: async (id) => {
    const response = await api.get(`/api/trips/${id}`)
    return response.data
  },

  createTrip: async (data) => {
    const response = await api.post('/api/trips', data)
    return response.data
  },

  updateTrip: async (id, data) => {
    const response = await api.put(`/api/trips/${id}`, data)
    return response.data
  },

  deleteTrip: async (id) => {
    await api.delete(`/api/trips/${id}`)
  }
}
