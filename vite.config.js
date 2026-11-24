import { defineConfig, loadEnv } from 'vite'
import handler from './api/photos.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.API_BASE_URL) process.env.API_BASE_URL = env.API_BASE_URL
  return {
    plugins: [{
      name: 'gallery-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (new URL(req.url, 'http://localhost').pathname === '/api/photos') return handler(req, res)
          next()
        })
      },
    }],
  }
})
