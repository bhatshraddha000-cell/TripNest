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

  getExpenseDetails: async (expenseId) => {
    const response = await api.get(`/api/expenses/${expenseId}`)
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
  },

  getMyTripBalance: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses/my-balance`)
    return response.data
  },

  getSettlementSummary: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/settlements/summary`)
    return response.data
  },

  markExpenseSplitPaid: async (splitId) => {
    const response = await api.patch(`/api/expense-splits/${splitId}/pay`)
    return response.data
  }
}
