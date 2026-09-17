import api from './apiClient'

// Card service functions for interacting with the backend API
// Fetch all cards for a specific board
export const getCards = (boardId) => api.get(`/boards/${boardId}/cards`)

// Create a new card for a specific board
export const createCard = (boardId, payload) => api.post(`/boards/${boardId}/cards`, payload)

// Update a card by its ID
export const updateCard = (boardId, cardId, payload) => {
  return api.put(`/boards/${boardId}/cards/${cardId}`, payload)
}

// Delete a card by its ID
export const deleteCard = (boardId, cardId) => api.delete(`/boards/${boardId}/cards/${cardId}`)
