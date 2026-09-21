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


// for comments and attachments
export const addCardComment = (boardId, cardId, payload) => {
  // payload can be FormData or an object { text }
  return api.post(`/boards/${boardId}/cards/${cardId}/comments`, payload)
}

//update comment
export const updateCardComment = (boardId, cardId, commentId, text) => {
  return api.put(`/boards/${boardId}/cards/${cardId}/comments/${commentId}`, { text })
}

//delete comment
export const deleteCardComment = (boardId, cardId, commentId) => {
  return api.delete(`/boards/${boardId}/cards/${cardId}/comments/${commentId}`)
}

//upload attachment in the comment 
export const uploadCardAttachment = (boardId, cardId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/boards/${boardId}/cards/${cardId}/attachments`, formData)
}

//delete attachment in the comment
export const deleteCardAttachment = (boardId, cardId, attachmentId) => {
  return api.delete(`/boards/${boardId}/cards/${cardId}/attachments/${attachmentId}`)
}
