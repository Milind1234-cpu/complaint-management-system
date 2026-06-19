import axios from 'axios'

// In local dev, Vite proxies /api → localhost:8000 so the empty string works.
// In production (Vercel), set VITE_API_BASE_URL to the Render backend URL
// e.g. https://cms-backend.onrender.com — then baseURL becomes that URL + '/api'.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

const client = axios.create({ baseURL: API_BASE })

// Attach JWT on every request — read from localStorage so interceptors work outside React
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cms_token')
      localStorage.removeItem('cms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default client
