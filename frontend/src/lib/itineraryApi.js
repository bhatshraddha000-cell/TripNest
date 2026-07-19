import { api } from './api.js'

export const itineraryApi = {
  getAllItineraries: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/itineraries`)
    return response.data
  },

  getItinerary: async (tripId, itineraryId) => {
    const response = await api.get(`/api/trips/${tripId}/itineraries/${itineraryId}`)
    return response.data
  },

  createItinerary: async (tripId, data) => {
    const response = await api.post(`/api/trips/${tripId}/itineraries`, data)
    return response.data
  },

  updateItinerary: async (tripId, itineraryId, data) => {
    const response = await api.put(`/api/trips/${tripId}/itineraries/${itineraryId}`, data)
    return response.data
  },

  deleteItinerary: async (tripId, itineraryId) => {
    await api.delete(`/api/trips/${tripId}/itineraries/${itineraryId}`)
  }
}
