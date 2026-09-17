import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
})

let refreshRequest = null

// Function to refresh the access token using the refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('Refresh token is missing')

  const response = await axios.post('http://localhost:5000/api/auth/refresh', { refreshToken })
  localStorage.setItem('accessToken', response.data.accessToken)
  localStorage.setItem('refreshToken', response.data.refreshToken)
  if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user))
  return response.data.accessToken
}

// Interceptor to attach the access token to every request
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Interceptor to handle 401 errors and refresh the access token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthRequest = originalRequest?.url?.includes('/auth/')

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshRequest = refreshRequest || refreshAccessToken()
      const accessToken = await refreshRequest
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      refreshRequest = null
    }
  }
)

export default apiClient
