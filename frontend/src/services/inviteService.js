import api from './apiClient'

export const acceptBoardInvite = (token) => api.get(`/boards/invites/${token}`)
