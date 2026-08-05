import { api } from './client.js'

export const login = (loginId, password) => api.post('/auth/login', { loginId, password }).then((r) => r.data)
export const logout = () => api.post('/auth/logout')
export const fetchMe = () => api.get('/auth/me').then((r) => r.data)
export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data)
export const forgotPassword = (loginId) => api.post('/auth/forgot-password', { loginId }).then((r) => r.data)
