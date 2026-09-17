import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { deleteBoardColumn, getBoards, inviteBoardMember, updateBoard } from '../services/boardService'
import { createCard, deleteCard, getCards, updateCard } from '../services/cardService'

const defaultColumns = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
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
  const [selectedCard, setSelectedCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
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
  const openCreate = () => {
    setSelectedCard(null)
    setEditingCard(null)
    setTitle('')
    setDescription('')
    setFile(null)
    setModalOpen(true)
  }

  // for opening an existing card
  const openCard = (card) => {
    setSelectedCard(card)
    setModalOpen(false)
  }

  // for editing an existing card
  const openEdit = (card) => {
    setSelectedCard(null)
    setEditingCard(card)
    setTitle(card.title)
    setDescription(card.description || '')
    setFile(null)
    setModalOpen(true)
  }

  // closes the card form modal and resets related state
  const closeCardForm = () => {
    setEditingCard(null)
    setTitle('')
    setDescription('')
    setFile(null)
    setModalOpen(false)
  }

  // handles the submission of the card form for creating or updating a card
  const handleCardSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim()) return

    // create a FormData object to handle file uploads along with other card data
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description)
    if (file) formData.append('file', file)

    try {
      setSaving(true)
      const response = editingCard
        ? await updateCard(boardId, editingCard._id, formData)
        : await createCard(boardId, formData)
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
  const handleDelete = async () => {
    if (!selectedCard) return

    try {
      await deleteCard(boardId, selectedCard._id)
      setCards((current) => current.filter((card) => card._id !== selectedCard._id))
      setSelectedCard(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete card')
    }
  }

  // saves the updated columns to the board and updates state accordingly
  const saveColumns = async (nextColumns) => {
    try {
      const response = await updateBoard(boardId, { columns: nextColumns })
      setColumns(response.data.board.columns)
      setBoard(response.data.board)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update columns')
    }
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
    selectedCard,
    editingCard,
    modalOpen,
    title,
    description,
    file,
    saving,
    memberModalOpen,
    memberEmail,
    columnModalOpen,
    columnName,
    setDraggedCard,
    setSelectedCard,
    setTitle,
    setDescription,
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
    openEdit,
    closeCardForm,
    handleCardSubmit,
    moveCard,
    handleDelete,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleAddMember,
  }
}
