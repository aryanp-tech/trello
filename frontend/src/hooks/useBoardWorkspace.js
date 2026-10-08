import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
  const selectedCard = useMemo(
    () => cards.find((c) => String(c._id) === String(activeCardId)) || null,
    [cards, activeCardId]
  )

  const setSelectedCard = useCallback((cardOrNull) => {
    setSelectedCardId(cardOrNull?._id || cardOrNull || null)
  }, [])

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
  const pendingColumnMoveRef = useRef(null)
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
      if (columnDebounceTimerRef.current) clearTimeout(columnDebounceTimerRef.current)
    }
  }, [boardId])

  const handleCloseCardModal = useCallback(() => {
    setSelectedCardId(null)
    if (searchParams.has('cardId')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('cardId')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Helper: Synchronize an updated card across cards list and selected card
  const updateLocalCard = useCallback((updated) => {
    setCards((current) => {
      const next = current.map((c) => (c._id === updated._id ? updated : c))
      lastSavedCardsRef.current = next
      return next
    })
    return updated
  }, [])

  // --- Card Form Actions ---
  const openCreate = useCallback((initialList = '') => {
    setSelectedCardId(null)
    setTitle('')
    setDescription('')
    setList(initialList || columns[0]?.id || '')
    setFile(null)
    setModalOpen(true)
  }, [columns])

  const openCard = useCallback((card) => {
    setSelectedCardId(card?._id || null)
    if (card?._id) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('cardId', card._id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const closeCardForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setList('')
    setFile(null)
    setModalOpen(false)
  }, [])

  const handleCardSubmit = useCallback(async (e) => {
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
  }, [boardId, title, description, list, file, closeCardForm])

  // --- Drag and Drop Position Sync with Numeric OrderKey System ---
  const handleReorderCards = useCallback(async (movePayload, nextCards) => {
    if (!movePayload?.cardId) return

    // nextCards was already applied optimistically by useBoardDnd
    if (nextCards) {
      lastSavedCardsRef.current = nextCards
    }

    // 2. Send only the necessary card movement information to the backend
    try {
      const res = await reorderCards(boardId, {
        cardId: movePayload.cardId,
        sourceColumnId: movePayload.sourceColumnId,
        targetColumnId: movePayload.targetColumnId,
        previousCardId: movePayload.previousCardId ?? null,
        nextCardId: movePayload.nextCardId ?? null,
      })

      if (res.data?.card) {
        // Update the card's server orderKey silently without forcing unnecessary layout re-renders
        setCards((current) => {
          const idx = current.findIndex((c) => c._id === res.data.card._id)
          if (idx === -1) return current
          const existing = current[idx]
          if (
            existing.orderKey === res.data.card.orderKey &&
            (existing.columnId || existing.list) === res.data.card.columnId
          ) {
            return current
          }
          const next = [...current]
          next[idx] = { ...existing, ...res.data.card }
          lastSavedCardsRef.current = next
          return next
        })
      }
    } catch (err) {
      console.error('Reorder cards error:', err)
      setError(err.response?.data?.message || 'Unable to save card order')

      // 5. Reconcile frontend state with the server if API fails
      try {
        const freshRes = await getCards(boardId)
        if (freshRes.data?.cards) {
          setCards(freshRes.data.cards)
          lastSavedCardsRef.current = freshRes.data.cards
        } else if (lastSavedCardsRef.current) {
          setCards(lastSavedCardsRef.current)
        }
      } catch {
        if (lastSavedCardsRef.current) setCards(lastSavedCardsRef.current)
      }
    }
  }, [boardId])

  const handleReorderColumns = useCallback((columnMovePayload, nextColumns) => {
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
  }, [boardId, columns])

  // --- Card Details, Attachments & Comments Actions ---
  const handleDelete = useCallback(async (cardIdToDelete) => {
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
  }, [boardId, selectedCard, handleCloseCardModal])

  const handleUpdateCardDetails = useCallback(async (cardId, updates) => {
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
  }, [boardId, updateLocalCard])

  const handleUploadAttachment = useCallback(async (cardId, attachmentFile) => {
    try {
      const res = await uploadCardAttachment(boardId, cardId, attachmentFile)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload file')
      throw err
    }
  }, [boardId, updateLocalCard])

  const handleDeleteAttachment = useCallback(async (cardId, attachmentId) => {
    try {
      const res = await deleteCardAttachment(boardId, cardId, attachmentId)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete attachment')
      throw err
    }
  }, [boardId, updateLocalCard])

  const handleAddCommentWithFile = useCallback(async (cardId, text, commentFile) => {
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
  }, [boardId, updateLocalCard])

  const handleUpdateComment = useCallback(async (cardId, commentId, nextText) => {
    try {
      const res = await updateCardComment(boardId, cardId, commentId, nextText)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to edit comment')
      throw err
    }
  }, [boardId, updateLocalCard])

  const handleDeleteComment = useCallback(async (cardId, commentId) => {
    try {
      const res = await deleteCardComment(boardId, cardId, commentId)
      return updateLocalCard(res.data.card)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete comment')
      throw err
    }
  }, [boardId, updateLocalCard])

  // --- Column Management Actions ---
  const saveColumns = useCallback(async (nextColumns) => {
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
  }, [boardId, columns])

  const handleAddColumn = useCallback(async (e) => {
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
  }, [boardId, columnName])

  const handleRenameColumn = useCallback(async (column) => {
    const label = window.prompt('Column name', column.label)?.trim()
    if (!label || label === column.label) return
    await saveColumns(columns.map((col) => (col.id === column.id ? { ...col, label } : col)))
  }, [columns, saveColumns])

  const handleDeleteColumn = useCallback(async (column) => {
    try {
      const res = await deleteBoardColumn(boardId, column.id)
      setColumns(res.data.board.columns)
      setBoard(res.data.board)
      setCards((current) => current.filter((c) => (c.columnId || c.list) !== column.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete column')
    }
  }, [boardId])

  // --- Member Management Actions ---
  const handleInviteMember = useCallback(async (email) => {
    try {
      const res = await inviteBoardMember(boardId, email)
      if (res.data.inviteUrl) {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(res.data.inviteUrl)
          setNotification({
            type: 'success',
            message: 'Invite link copied to clipboard! Share it with your teammate.',
          })
        } else {
          window.prompt('Copy this invite link:', res.data.inviteUrl)
        }
      } else {
        setNotification({
          type: 'success',
          message: res.data.message || 'Invitation sent successfully.',
        })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send invitation.'
      setNotification({ type: 'error', message: msg })
      throw err
    }
  }, [boardId])

  const handleAddMember = useCallback(async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return
    try {
      await handleInviteMember(memberEmail.trim())
      setMemberEmail('')
      setMemberModalOpen(false)
    } catch {
      // Error notification handled in handleInviteMember
    }
  }, [memberEmail, handleInviteMember])

  const handleRemoveMember = useCallback(async (memberId) => {
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
  }, [boardId])

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
