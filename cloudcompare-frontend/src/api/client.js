import axios from 'axios'

// ─── API base resolution ────────────────────────────────────────────────────
// In production the app is served by Vercel, which proxies `/api/*` to the
// Spring Boot backend on Render (see vercel.json rewrites). So we call the API
// relative to our own origin — exactly like the legacy static dashboard served
// by Render — which needs no CORS and no env var.
//
// You can still override this by setting `VITE_API_BASE` on Vercel to the full
// backend URL (e.g. https://cloudcompare-ai-api.onrender.com, no trailing
// slash); any trailing slash is stripped. If it's unset we stay same-origin.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email, password)         => api.post('/auth/login',  { email, password }),
  signup: (name, email, password)   => api.post('/auth/signup', { name, email, password })
}

// ─── Cloud Compare ─────────────────────────────────────────────────────────
export const cloudApi = {
  compare:        (params)   => api.post('/compare', params),
  getServiceTypes:(category) => api.get(`/service-types/${category}`),
  getRegions:     ()         => api.get('/regions')
}

// ─── AI Tools ──────────────────────────────────────────────────────────────
export const aiApi = {
  compareTools: (purpose) => api.post('/ai-compare',   { purpose }),
  nlpCompare:   (query)   => api.post('/nlp-compare',  { query })
}

// ─── Chatbot Assistants ────────────────────────────────────────────────────
export const chatApi = {
  cloud:   (question, cloudContext = {})    => api.post('/chat/cloud',    { question, cloudContext }),
  aiTools: (question, aiToolsContext = {}) => api.post('/chat/ai-tools', { question, aiToolsContext })
}

// ─── Health ────────────────────────────────────────────────────────────────
// Spring Boot serves GET /api/test; the Python mock also exposes /api/health.
export const healthApi = {
  check: () => api.get('/test')
}

export default api
