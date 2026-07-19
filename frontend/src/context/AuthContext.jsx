import { createContext, useContext, useEffect, useState } from 'react'
import { api, getAuthToken, setAuthToken } from '../lib/api.js'

const AuthContext = createContext(null)

function normalizeError(error, fallbackMessage) {
  const responseData = error?.response?.data
  const message = responseData?.message ?? error?.message ?? fallbackMessage

  if (responseData?.errors && typeof responseData.errors === 'object') {
    return {
      message,
      fieldErrors: responseData.errors,
    }
  }

  const fieldErrors = {}
  if (error?.response?.status === 409 || message.toLowerCase().includes('already registered')) {
    fieldErrors.email = 'This email address is already registered. Please sign in instead.'
  }

  return {
    message: fieldErrors.email ? 'This email address is already registered.' : message,
    fieldErrors,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()))
  const [authLoading, setAuthLoading] = useState(true)

  async function loadCurrentUser() {
    try {
      const response = await api.get('/api/users/me')
      setUser(response.data)
      setIsAuthenticated(true)
      return response.data
    } catch (error) {
      setAuthToken(null)
      setUser(null)
      setIsAuthenticated(false)
      throw error
    }
  }

  async function register(payload) {
    try {
      await api.post('/api/auth/register', payload)
      return { success: true }
    } catch (error) {
      throw normalizeError(error, 'Registration failed')
    }
  }

  async function login(payload) {
    try {
      const response = await api.post('/api/auth/login', payload)
      const token = response.data?.token

      if (!token) {
        throw new Error('Login response did not include a token')
      }

      setAuthToken(token)
      setIsAuthenticated(true)
      await loadCurrentUser()
      return response.data
    } catch (error) {
      if (error.message === 'Login response did not include a token') {
        setAuthToken(null)
        setUser(null)
        setIsAuthenticated(false)
        throw { message: error.message, fieldErrors: {} }
      }

      setAuthToken(null)
      setUser(null)
      setIsAuthenticated(false)
      throw normalizeError(error, 'Login failed')
    }
  }

  function logout() {
    setAuthToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  function updateUser(updates) {
    setUser((current) => (current ? { ...current, ...updates } : current))
  }

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = getAuthToken()

      if (!token) {
        if (!cancelled) {
          setAuthLoading(false)
          setIsAuthenticated(false)
        }
        return
      }

      try {
        const response = await api.get('/api/users/me')

        if (!cancelled) {
          setUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        if (!cancelled) {
          setAuthToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = error.config?.url ?? ''
        const isPublicAuthRequest =
          requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register')

        if (error.response?.status === 401 && !isPublicAuthRequest) {
          setAuthToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }

        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.response.eject(interceptorId)
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    authLoading,
    register,
    login,
    logout,
    loadCurrentUser,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
