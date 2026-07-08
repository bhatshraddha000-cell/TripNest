import axios from 'axios'

const TOKEN_KEY = 'tripnest_token'

let authToken = localStorage.getItem(TOKEN_KEY)

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token) {
  authToken = token

  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAuthToken() {
  return authToken
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }

  return config
})
