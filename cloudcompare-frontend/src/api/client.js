import axios from 'axios'
const runtimeConfig = window.__CLOUDCOMPARE_CONFIG__ || {}
const API_BASE = (runtimeConfig.API_BASE || import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const api = axios.create({ baseURL: `${API_BASE}/api`, headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
export const authApi = { login: (e,p) => api.post('/auth/login',{email:e,password:p}), signup: (n,e,p) => api.post('/auth/signup',{name:n,email:e,password:p}) }
export const cloudApi = { compare: (p) => api.post('/compare',p), getServiceTypes: (c) => api.get(`/service-types/${c}`), getRegions: () => api.get('/regions') }
export const aiApi = { compareTools: (purpose) => api.post('/ai-compare',{purpose}), nlpCompare: (query) => api.post('/nlp-compare',{query}) }
export const chatApi = { cloud: (q,c={}) => api.post('/chat/cloud',{question:q,cloudContext:c}), aiTools: (q,c={}) => api.post('/chat/ai-tools',{question:q,aiToolsContext:c}) }
export const healthApi = { check: () => api.get('/test') }
export default api
