import axios from 'axios'

// Create an Axios instance for API requests

const API_URL = 'http://localhost:5000/api/auth'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


//login user
export const loginUser = (payload) => api.post('/login', payload)
//register new user
export const registerUser = (payload) => api.post('/register', payload)
//request password reset
export const requestPasswordReset = (email) => api.post('/forgot-password', { email })
//reset password with token
export const resetPassword = (token, payload) => api.post(`/reset-password/${token}`, payload)
