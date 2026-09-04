#!/usr/bin/env bash
set -euo pipefail
mkdir -p cloudcompare-frontend

cat > cloudcompare-frontend/vercel.json <<'EOF'
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [ { "source": "/(.*)", "destination": "/index.html" } ]
}
EOF

cat > cloudcompare-frontend/.env.example <<'EOF'
VITE_API_BASE=
EOF

cat > cloudcompare-frontend/vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: { port: 3000, host: true, allowedHosts: true,
    proxy: { '/api': 'http://localhost:8080' } },
  build: { outDir: 'dist', emptyOutDir: true }
})
EOF

cat > cloudcompare-frontend/src/main.jsx <<'EOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
EOF

cat > cloudcompare-frontend/src/api/client.js <<'EOF'
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
EOF

sed -i '' '\#/app/runtime-config.js#d' cloudcompare-frontend/index.html
sed -i '' 's|^server.port=8080$|server.port=${PORT:8080}|' src/main/resources/application.properties

echo "OK - config files created"
