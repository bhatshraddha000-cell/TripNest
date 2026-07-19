import { api } from './api.js'

function toDestinationRequest(payload) {
  return {
    name: payload.name?.trim() ?? '',
    description: payload.description?.trim() || null,
    state: payload.state?.trim() || null,
    country: payload.country?.trim() ?? '',
    category: payload.category,
    bestTimeToVisit: payload.bestTimeToVisit?.trim() || null,
    weatherInfo: payload.weatherInfo?.trim() || null,
    imageUrl: payload.imageUrl?.trim() || null,
  }
}

export const destinationService = {
  async getAllDestinations() {
    const response = await api.get('/api/destinations')
    return response.data
  },

  async getDestinationById(id) {
    const response = await api.get(`/api/destinations/${id}`)
    return response.data
  },

  async searchDestinations(query) {
    const response = await api.get('/api/destinations/search', { params: { query } })
    return response.data
  },

  async filterByCategory(category) {
    const response = await api.get(`/api/destinations/category/${category}`)
    return response.data
  },

  async createDestination(payload) {
    const response = await api.post('/api/destinations', toDestinationRequest(payload))
    return response.data
  },

  async updateDestination(id, payload) {
    const response = await api.put(`/api/destinations/${id}`, toDestinationRequest(payload))
    return response.data
  },

  async deleteDestination(id) {
    await api.delete(`/api/destinations/${id}`)
  },
}
