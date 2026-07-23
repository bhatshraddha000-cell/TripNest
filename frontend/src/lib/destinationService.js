import { api } from './api.js'

export const destinationService = {
  async getMyDestinations() {
    const response = await api.get('/api/destinations/my-destinations')
    return response.data
  },

  async getDestinationDetails(tripId) {
    const response = await api.get(`/api/destinations/my-destinations/${tripId}`)
    return response.data
  }
}
