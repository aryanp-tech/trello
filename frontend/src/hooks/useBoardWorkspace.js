import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  createBoardColumn,
  deleteBoardColumn,
  getBoards,
  inviteBoardMember,
  removeBoardMember,
  updateBoard,
} from '../services/boardService'
import {
  addCardComment,
  createCard,
  deleteCard,
  deleteCardAttachment,
  deleteCardComment,
  getCards,
  reorderCards,
  updateCard,
  updateCardComment,
  uploadCardAttachment,
} from '../services/cardService'

export const useBoardWorkspace = () => {
  const { boardId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCardId = searchParams.get('cardId')

  // Board & Cards State
  const [board, setBoard] = useState(null)
  const [cards, setCards] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)

  const activeCardId = urlCardId || selectedCardId
  const selectedCard = cards.find((c) => String(c._id) === String(activeCardId)) || null

  const setSelectedCard = (cardOrNull) => {
    setSelectedCardId(cardOrNull?._id || cardOrNull || null)
  }

  // Card Creation Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [list, setList] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)

  // Column & Member Modals State
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [columnName, setColumnName] = useState('')

  // Persistence Refs & Debounce Timers
  const lastSavedCardsRef = useRef([])
  const pendingCardMoveRef = useRef(null)
  const pendingColumnMoveRef = useRef(null)
  const cardDebounceTimerRef = useRef(null)
  const columnDebounceTimerRef = useRef(null)

  // Load board and cards on mount or boardId change
  useEffect(() => {
    let active = true

    Promise.all([getBoards(), getCards(boardId)])
      .then(([boardRes, cardRes]) => {
        if (!active) return
        const currentBoard = (boardRes.data.boards || []).find((b) => b._id === boardId) || null
        setBoard(currentBoard)
        setColumns(currentBoard?.columns || [])

        const initialCards = cardRes.data.cards || []
        setCards(initialCards)
        lastSavedCardsRef.current = initialCards
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load board')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (cardDebounceTimerRef.current) clearTimeout(cardDebounceTimerRef.current)
      if (columnDebounceTimerRef.current) clearTimeout(columnDebounceTimerRef.current)
    }
  }, [boardId])

  const handleCloseCardModal = () => {
    setSelectedCardId(null)
    if (searchParams.has('cardId')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('cardId')
      setSearchParams(nextParams, { replace: true })
    }
  }

  // Helper: Synchronize an updated card across cards list and selected card
  const updateLocalCard = (updated) => {
    setCards((current) => {
      const next = current.map((c) => (c._id === updated._id ? updated : c))
      lastSavedCardsRef.current = next
      return next
    })
    return updated
  }

  // --- Card Form Actions ---
  const openCreate = (initialList = '') => {
    setSelectedCard(null)
    setTitle('')
    setDescription('')
    setList(initialList || columns[0]?.id || '')
    setFile(null)
    setModalOpen(true)
  }

  const openCard = (card) => {
    setSelectedCard(card)
    if (card?._id) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('cardId', card._id)
      setSearchParams(nextParams, { replace: true })
    }
  }

  const closeCardForm = () => {
    setTitle('')
    setDescription('')
    setList('')
    setFile(null)
    setModalOpen(false)
  }

  const handleCardSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description)
    if (list) formData.append('list', list)
    if (file) formData.append('file', file)

    try {
      setSaving(true)
      const res = await createCard(boardId, formData)
      if (res.data.board) {
        setBoard(res.data.board)
        setColumns(res.data.board.columns)
      }
      setCards((current) => {
        const next = [...current, res.data.card]
        lastSavedCardsRef.current = next
        return next
      })
      closeCardForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save card')
    } finally {
      setSaving(false)
    }
  }

  // --- Drag and Drop Position Sync (Debounced, Zero In-Memory Shifts) ---
  const handleReorderCards = (movePayload, nextCards) => {
    if (nextCards) setCards(nextCards)
    if (!movePayload?.cardId) return

    pendingCardMoveRef.current = movePayload

    if (cardDebounceTimerRef.current) clearTimeout(cardDebounceTimerRef.current)

    cardDebounceTimerRef.current = setTimeout(async () => {
      const payload = pendingCardMoveRef.current
      pendingCardMoveRef.current = null
      if (!payload) return

      try {
        await reorderCards(boardId, payload)
        lastSavedCardsRef.current = nextCards || cards
      } catch (err) {
        if (lastSavedCardsRef.current) setCards(lastSavedCardsRef.current)
        setError(err.response?.data?.message || 'Unable to save card order')
      }
    }, 400)
  }

  const handleReorderColumns = (columnMovePayload, nextColumns) => {
    const prevColumns = columns
    if (nextColumns) setColumns(nextColumns)
    if (!columnMovePayload?.columnId) return

    pendingColumnMoveRef.current = columnMovePayload

    if (columnDebounceTimerRef.current) clearTimeout(columnDebounceTimerRef.current)

    columnDebounceTimerRef.current = setTimeout(async () => {
      const payload = pendingColumnMoveRef.current
      pendingColumnMoveRef.current = null
      if (!payload) return

      try {
        const res = await updateBoard(boardId, payload)
        if (res.data.board) {
          setColumns(res.data.board.columns)
          setBoard(res.data.board)
        }
      } catch (err) {
        setColumns(prevColumns)
        setError(err.response?.data?.message || 'Unable to update columns')
      }
    }, 400)
  }

  // --- Card Details, Attachments & Comments Actions ---
  const handleDelete = async (cardIdToDelete) => {
    const targetId = cardIdToDelete || selectedCard?._id
    if (!targetId) return

    try {
      await deleteCard(boardId, targetId)
      setCards((current) => {
        const next = current.filter((c) => c._id !== targetId)
        lastSavedCardsRef.current = next
        return next
      })
      if (selectedCard?._id === targetId) {
        handleCloseCardModal()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete card')
    }
  }

  const handleUpdateCardDetails = async (cardId, updates) => {
    try {
      const res = await updateCard(boardId, cardId, updates)
      if (res.data.board) {
        setBoard(res.data.board)
        setColumns(res.data.board.columns)
      }
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update card')
      throw err
    }
  }

  const handleUploadAttachment = async (cardId, attachmentFile) => {
    try {
      const res = await uploadCardAttachment(boardId, cardId, attachmentFile)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload file')
      throw err
    }
  }

  const handleDeleteAttachment = async (cardId, attachmentId) => {
    try {
      const res = await deleteCardAttachment(boardId, cardId, attachmentId)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete attachment')
      throw err
    }
  }

  const handleAddCommentWithFile = async (cardId, text, commentFile) => {
    try {
      setCommentSaving(true)
      let payload = { text }
      if (commentFile) {
        payload = new FormData()
        if (text) payload.append('text', text)
        payload.append('file', commentFile)
      }
      const res = await addCardComment(boardId, cardId, payload)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add comment')
      throw err
    } finally {
      setCommentSaving(false)
    }
  }

  const handleUpdateComment = async (cardId, commentId, nextText) => {
    try {
      const res = await updateCardComment(boardId, cardId, commentId, nextText)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to edit comment')
      throw err
    }
  }

  const handleDeleteComment = async (cardId, commentId) => {
    try {
      const res = await deleteCardComment(boardId, cardId, commentId)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete comment')
      throw err
    }
  }

  // --- Column Management Actions ---
  const saveColumns = async (nextColumns) => {
    const prevColumns = columns
    setColumns(nextColumns)
    try {
      const res = await updateBoard(boardId, { columns: nextColumns })
      setColumns(res.data.board.columns)
      setBoard(res.data.board)
    } catch (err) {
      setColumns(prevColumns)
      setError(err.response?.data?.message || 'Unable to update columns')
    }
  }

  const handleAddColumn = async (e) => {
    e.preventDefault()
    const label = columnName.trim()
    if (!label) return

    try {
      const res = await createBoardColumn(boardId, label)
      if (res.data.board) {
        setBoard(res.data.board)
        setColumns(res.data.board.columns)
      }
      setColumnName('')
      setColumnModalOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add column')
    }
  }

  const handleRenameColumn = async (column) => {
    const label = window.prompt('Column name', column.label)?.trim()
    if (!label || label === column.label) return
    await saveColumns(columns.map((col) => (col.id === column.id ? { ...col, label } : col)))
  }

  const handleDeleteColumn = async (column) => {
    try {
      const res = await deleteBoardColumn(boardId, column.id)
      setColumns(res.data.board.columns)
      setBoard(res.data.board)
      setCards((current) => {
        const next = current.filter((c) => c.list !== column.id)
        lastSavedCardsRef.current = next
        return next
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete column')
    }
  }

  const handleInviteMember = async (email, cardId = null) => {
    if (!email?.trim()) return null
    try {
      const res = await inviteBoardMember(boardId, email.trim(), cardId)
      if (res.data.member) {
        setBoard((prev) => {
          if (!prev) return prev
          const exists = (prev.members || []).some((m) => String(m._id || m) === String(res.data.member._id))
          return exists ? prev : { ...prev, members: [...(prev.members || []), res.data.member] }
        })
        if (cardId && res.data.card) {
          setCards((prev) => prev.map((c) => (c._id === cardId ? res.data.card : c)))
        }
      }
      setNotification({ type: 'success', message: res.data.message || 'Invitation sent successfully.' })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to send invitation.'
      setNotification({ type: 'error', message: msg })
      throw err
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return

    try {
      await handleInviteMember(memberEmail.trim())
      setMemberEmail('')
      setMemberModalOpen(false)
    } catch {
      // Error notification handled in handleInviteMember
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await removeBoardMember(boardId, memberId)
      if (res.data.board) {
        setBoard(res.data.board)
      } else {
        setBoard((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            members: (prev.members || []).filter((m) => String(m._id || m) !== String(memberId)),
          }
        })
      }
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          members: (c.members || []).filter((m) => String(m._id || m) !== String(memberId)),
        }))
      )
      setNotification({ type: 'success', message: res.data.message || 'Member removed successfully.' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to remove member.'
      setNotification({ type: 'error', message: msg })
      throw err
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
    selectedCard,
    modalOpen,
    title,
    description,
    list,
    file,
    saving,
    commentSaving,
    memberModalOpen,
    memberEmail,
    columnModalOpen,
    columnName,
    setSelectedCard,
    setTitle,
    setDescription,
    setList,
    setFile,
    setMemberModalOpen,
    setMemberEmail,
    setColumnModalOpen,
    setColumnName,
    setError,
    setNotification,
    setModalOpen,
    openCreate,
    openCard,
    closeCardForm,
    handleCardSubmit,
    handleReorderCards,
    handleReorderColumns,
    setCards,
    saveColumns,
    handleDelete,
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
    handleInviteMember,
    handleRemoveMember,
    handleCloseCardModal,
  }
}
