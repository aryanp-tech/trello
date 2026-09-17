import axios from 'axios'

// Create an Axios instance for API requests

const API_URL = 'http://localhost:5000/api/auth'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const loginUser = (payload) => api.post('/login', payload)
export const registerUser = (payload) => api.post('/register', payload)
export const requestPasswordReset = (email) => api.post('/forgot-password', { email })
export const resetPassword = (token, payload) => api.post(`/reset-password/${token}`, payload)
