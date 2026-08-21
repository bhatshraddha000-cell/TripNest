import { api } from './api.js'

export const activityApi = {
  getAllActivities: async (tripId, itineraryId) => {
    const response = await api.get(`/api/trips/${tripId}/itineraries/${itineraryId}/activities`)
    return response.data
  },

  getActivity: async (tripId, itineraryId, activityId) => {
    const response = await api.get(`/api/trips/${tripId}/itineraries/${itineraryId}/activities/${activityId}`)
    return response.data
  },

  createActivity: async (tripId, itineraryId, data) => {
    const response = await api.post(`/api/trips/${tripId}/itineraries/${itineraryId}/activities`, data)
    return response.data
  },

  updateActivity: async (tripId, itineraryId, activityId, data) => {
    const response = await api.put(`/api/trips/${tripId}/itineraries/${itineraryId}/activities/${activityId}`, data)
    return response.data
  },

  deleteActivity: async (tripId, itineraryId, activityId) => {
    await api.delete(`/api/trips/${tripId}/itineraries/${itineraryId}/activities/${activityId}`)
  }
}
