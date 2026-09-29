import api from './apiClient'

// Board service functions
// Get all boards for the authenticated user
export const getBoards = () => api.get('/boards')

// Create a new board
export const createBoard = (payload) => api.post('/boards', payload)

// Update a board by ID
export const updateBoard = (id, payload) => api.put(`/boards/${id}`, payload)

// Create a new column on a board
export const createBoardColumn = (id, label) => api.post(`/boards/${id}/columns`, { label })

// Delete a column and all cards inside it
export const deleteBoardColumn = (id, columnId) => api.delete(`/boards/${id}/columns/${columnId}`)

// Delete a board by ID
export const deleteBoard = (id) => api.delete(`/boards/${id}`)

// Card and board member invitation service
export const inviteBoardMember = (id, email, cardId = null) =>
  api.post(`/boards/${id}/invites`, { email, cardId });

// Remove a member from a board (owner only)
export const removeBoardMember = (id, memberId) =>
  api.delete(`/boards/${id}/members/${memberId}`);
