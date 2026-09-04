import { useState, useCallback } from 'react'
import { cloudApi } from '../api/client'

export function useCompare() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const compare = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await cloudApi.compare(params)
      // BUG 2 FIX: backend wraps payload in res.data.data
      // e.g. { data: { services: [...], recommendation: "...", summary: {...} } }
      const payload = res.data?.data || res.data
      setResults(payload)
      return payload
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Comparison failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults(null)
    setError(null)
  }, [])

  return { results, loading, error, compare, clearResults }
}
