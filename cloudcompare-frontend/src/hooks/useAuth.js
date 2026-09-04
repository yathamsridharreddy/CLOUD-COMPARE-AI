import { useState, useEffect, useCallback } from 'react'

const USER_KEY  = 'cc_user'
const TOKEN_KEY = 'token'

/**
 * Attempts to decode a JWT payload from a token string.
 * Falls back to null safely — avoids crashing on non-standard tokens.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Pad base64 to a multiple of 4 chars
    const padded  = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(padded + '=='.slice((padded.length + 3) % 4 || 4))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })

  // BUG 3 FIX: gracefully handle non-JWT tokens by also reading stored user object
  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    // Try to read user from localStorage first (set during login/signup)
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
    })()

    if (storedUser) {
      setUser(storedUser)
      return
    }

    // Fallback: decode JWT payload
    const payload = decodeJwtPayload(token)
    if (payload) {
      setUser({ email: payload.sub, name: payload.name, exp: payload.exp })
    } else {
      // Token exists but can't be decoded — clear it
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
    }
  }, [token])

  const login = useCallback((newToken, userData = null) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)

    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
    } else {
      // Decode from JWT
      const payload = decodeJwtPayload(newToken)
      if (payload) {
        const u = { email: payload.sub, name: payload.name, exp: payload.exp }
        localStorage.setItem(USER_KEY, JSON.stringify(u))
        setUser(u)
      }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user

  return { user, token, isAuthenticated, login, logout }
}
