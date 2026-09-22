// Minimal SPA static server for Railway (respects the injected PORT).
// Serves the Vite build in ./dist and falls back to index.html for SPA routes.
import http from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./dist', import.meta.url))
const port = process.env.PORT || 3000
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
}

http.createServer((req, res) => {
  let path = decodeURIComponent((req.url || '/').split('?')[0])
  if (path === '/') path = '/index.html'
  const file = normalize(join(root, path))

  try {
    if (statSync(file).isFile()) {
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
      createReadStream(file).pipe(res)
      return
    }
  } catch {
    /* fall through to SPA fallback */
  }

  // SPA fallback
  const index = join(root, 'index.html')
  res.setHeader('Content-Type', types['.html'])
  createReadStream(index).pipe(res)
}).listen(port, '0.0.0.0', () => {
  console.log(`CloudCompare AI frontend serving on http://0.0.0.0:${port}`)
})
