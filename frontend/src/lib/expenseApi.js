import { api } from './api.js'

export const expenseApi = {
  addExpense: async (tripId, data) => {
    const response = await api.post(`/api/trips/${tripId}/expenses`, data)
    return response.data
  },

  getTripExpenses: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses`)
    return response.data
  },

  updateExpense: async (expenseId, data) => {
    const response = await api.put(`/api/expenses/${expenseId}`, data)
    return response.data
  },

  deleteExpense: async (expenseId) => {
    await api.delete(`/api/expenses/${expenseId}`)
  },

  getBudgetSummary: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/budget-summary`)
    return response.data
  }
}
