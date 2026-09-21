import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { deleteBoardColumn, getBoards, inviteBoardMember, updateBoard } from '../services/boardService'
import {
  addCardComment,
  createCard,
  deleteCard,
  deleteCardAttachment,
  deleteCardComment,
  getCards,
  updateCard,
  updateCardComment,
  uploadCardAttachment,
} from '../services/cardService'

const defaultColumns = [
  { id: 'do', label: 'Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'to-be-done', label: 'To Be Done' },
  { id: 'final', label: 'Final' },
]

// custom hook for managing the state and logic of the board workspace
export const useBoardWorkspace = () => {
  const { boardId } = useParams()
  const [board, setBoard] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [draggedCard, setDraggedCard] = useState(null)
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [list, setList] = useState('')
  const [file, setFile] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [columns, setColumns] = useState(defaultColumns)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [columnName, setColumnName] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([getBoards(), getCards(boardId)])
      .then(([boardResponse, cardResponse]) => {
        if (!active) return
        const nextBoard = (boardResponse.data.boards || []).find((item) => item._id === boardId) || null
        setBoard(nextBoard)
        setColumns(nextBoard?.columns?.length ? nextBoard.columns : defaultColumns)
        setCards(cardResponse.data.cards || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load board')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [boardId])

  // for creating a new card
  const openCreate = (initialList = '') => {
    setSelectedCard(null)
    setEditingCard(null)
    setTitle('')
    setDescription('')
    setList(initialList || (columns[0]?.id || 'do'))
    setFile(null)
    setModalOpen(true)
  }

  // for opening an existing card
  const openCard = (card) => {
    setSelectedCard(card)
    setEditingCard(card)
    setTitle(card.title)
    setDescription(card.description || '')
    setList(card.list || '')
    setFile(null)
    setCommentText('')
    setModalOpen(false)
  }

  // for editing an existing card
  const openEdit = (card) => {
    setSelectedCard(null)
    setEditingCard(card)
    setTitle(card.title)
    setDescription(card.description || '')
    setList(card.list || '')
    setFile(null)
    setModalOpen(true)
  }

  // closes the card form modal and resets related state
  const closeCardForm = () => {
    setEditingCard(null)
    setTitle('')
    setDescription('')
    setList('')
    setFile(null)
    setModalOpen(false)
    setSelectedCard(null)
  }

  // handles the submission of the card form for creating or updating a card
  const handleCardSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) return

    // create a FormData object to handle file uploads along with other card data
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description)
    if (list) formData.append('list', list)
    if (file) formData.append('file', file)

    try {
      setSaving(true)
      const response = editingCard
        ? await updateCard(boardId, editingCard._id, formData)
        : await createCard(boardId, formData)

      if (response.data.board) {
        setBoard(response.data.board)
        setColumns(response.data.board.columns)
      }

      setCards((current) => editingCard
        ? current.map((card) => card._id === editingCard._id ? response.data.card : card)
        : [...current, response.data.card])
      closeCardForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save card')
    } finally {
      setSaving(false)
    }
  }

  // handles moving a card to a different column
  const moveCard = async (list) => {
    if (!draggedCard || draggedCard.list === list) return

    const previousCards = cards
    setCards((current) => current.map((card) => (
      card._id === draggedCard._id ? { ...card, list } : card
    )))
    setDraggedCard(null)

    try {
      await updateCard(boardId, draggedCard._id, { list })
    } catch (requestError) {
      setCards(previousCards)
      setError(requestError.response?.data?.message || 'Unable to move card')
    }
  }

  // handles deleting a card from the board
  const handleDelete = async (cardIdToDelete) => {
    const targetId = cardIdToDelete || selectedCard?._id
    if (!targetId) return

    try {
      await deleteCard(boardId, targetId)
      setCards((current) => current.filter((card) => card._id !== targetId))
      if (selectedCard?._id === targetId) {
        setSelectedCard(null)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete card')
    }
  }

  // Update card fields directly (title, description, list)
  const handleUpdateCardDetails = async (cardId, updates) => {
    try {
      const response = await updateCard(boardId, cardId, updates)
      const updated = response.data.card
      if (response.data.board) {
        setBoard(response.data.board)
        setColumns(response.data.board.columns)
      }
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update card')
      throw requestError
    }
  }

  // Upload file attachment directly to card
  const handleUploadAttachment = async (cardId, attachmentFile) => {
    try {
      const response = await uploadCardAttachment(boardId, cardId, attachmentFile)
      const updated = response.data.card
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to upload file')
      throw requestError
    }
  }

  // Delete an attachment from a card
  const handleDeleteAttachment = async (cardId, attachmentId) => {
    try {
      const response = await deleteCardAttachment(boardId, cardId, attachmentId)
      const updated = response.data.card
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete attachment')
      throw requestError
    }
  }

  // Add comment with optional file attachment
  const handleAddCommentWithFile = async (cardId, text, commentFile) => {
    try {
      setCommentSaving(true)
      let payload
      if (commentFile) {
        payload = new FormData()
        if (text) payload.append('text', text)
        payload.append('file', commentFile)
      } else {
        payload = { text }
      }

      const response = await addCardComment(boardId, cardId, payload)
      const updated = response.data.card
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add comment')
      throw requestError
    } finally {
      setCommentSaving(false)
    }
  }

  // Update a comment text
  const handleUpdateComment = async (cardId, commentId, nextText) => {
    try {
      const response = await updateCardComment(boardId, cardId, commentId, nextText)
      const updated = response.data.card
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to edit comment')
      throw requestError
    }
  }

  // Delete a comment
  const handleDeleteComment = async (cardId, commentId) => {
    try {
      const response = await deleteCardComment(boardId, cardId, commentId)
      const updated = response.data.card
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      if (selectedCard?._id === updated._id) {
        setSelectedCard(updated)
      }
      return updated
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete comment')
      throw requestError
    }
  }

  const handleAddComment = async (event) => {
    event.preventDefault()
    if (!selectedCard || !commentText.trim()) return

    try {
      setCommentSaving(true)
      const response = await addCardComment(boardId, selectedCard._id, { text: commentText })
      setSelectedCard(response.data.card)
      setCards((current) => current.map((card) => (
        card._id === response.data.card._id ? response.data.card : card
      )))
      setCommentText('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add comment')
    } finally {
      setCommentSaving(false)
    }
  }

  // saves the updated columns to the board and updates state accordingly
  const saveColumns = async (nextColumns) => {
    const previousColumns = columns
    setColumns(nextColumns)

    try {
      const response = await updateBoard(boardId, { columns: nextColumns })
      setColumns(response.data.board.columns)
      setBoard(response.data.board)
    } catch (requestError) {
      setColumns(previousColumns)
      setError(requestError.response?.data?.message || 'Unable to update columns')
    }
  }

  // moves a column and persists its new position
  const moveColumn = async (targetColumnId) => {
    if (!draggedColumn || draggedColumn === targetColumnId) return

    const sourceIndex = columns.findIndex((column) => column.id === draggedColumn)
    const targetIndex = columns.findIndex((column) => column.id === targetColumnId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const nextColumns = [...columns]
    const [column] = nextColumns.splice(sourceIndex, 1)
    const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
    nextColumns.splice(insertionIndex, 0, column)
    setDraggedColumn(null)
    await saveColumns(nextColumns)
  }

  // handles adding a new column to the board
  const handleAddColumn = async (event) => {
    event.preventDefault()
    const label = columnName.trim()
    if (!label) return

    const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    await saveColumns([...columns, { id, label }])
    setColumnName('')
    setColumnModalOpen(false)
  }

  // handles renaming an existing column on the board
  const handleRenameColumn = async (column) => {
    const label = window.prompt('Column name', column.label)?.trim()
    if (!label || label === column.label) return
    await saveColumns(columns.map((item) => item.id === column.id ? { ...item, label } : item))
  }

  // deletes a column and all cards inside it
  const handleDeleteColumn = async (column) => {
    try {
      const response = await deleteBoardColumn(boardId, column.id)
      setColumns(response.data.board.columns)
      setBoard(response.data.board)
      setCards((current) => current.filter((card) => card.list !== column.id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete column')
    }
  }

  // handles inviting a new member to the board via email
  const handleAddMember = async (event) => {
    event.preventDefault()
    if (!memberEmail.trim()) return

    try {
      await inviteBoardMember(boardId, memberEmail.trim())
      setMemberEmail('')
      setMemberModalOpen(false)
      setNotification({ type: 'success', message: 'The board invitation was sent successfully.' })
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to send the board invitation.'
      setError(message)
      setNotification({ type: 'error', message })
    }
  }

  return {
    boardId,
    board,
    cards,
    columns,
    loading,
    error,
    notification,
    draggedCard,
    draggedColumn,
    selectedCard,
    editingCard,
    modalOpen,
    title,
    description,
    list,
    file,
    commentText,
    commentSaving,
    saving,
    memberModalOpen,
    memberEmail,
    columnModalOpen,
    columnName,
    setDraggedCard,
    setDraggedColumn,
    setSelectedCard,
    setTitle,
    setDescription,
    setList,
    setFile,
    setCommentText,
    setMemberModalOpen,
    setMemberEmail,
    setColumnModalOpen,
    setColumnName,
    setError,
    setNotification,
    setModalOpen,
    openCreate,
    openCard,
    openEdit,
    closeCardForm,
    handleCardSubmit,
    moveCard,
    moveColumn,
    handleDelete,
    handleAddComment,
    handleUpdateCardDetails,
    handleUploadAttachment,
    handleDeleteAttachment,
    handleAddCommentWithFile,
    handleUpdateComment,
    handleDeleteComment,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleAddMember,
  }
}
