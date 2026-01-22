import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: false, // Disable cookies - using sessionStorage
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Log the error for debugging
      console.error('API Error:', error.response?.data)
      console.error('Status:', error.response?.status)
      
      // Only logout for 401 (unauthorized), not 403 (forbidden)
      if (error.response?.status === 401) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        // Don't auto-redirect - let the auth context handle it
      }
    }
    return Promise.reject(error)
  }
)

export default api


