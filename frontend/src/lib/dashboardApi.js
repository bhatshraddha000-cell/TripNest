import { api } from './api.js'

export const dashboardApi = {
  getDashboardData: async () => {
    const response = await api.get('/api/dashboard')
    return response.data
  },
}
