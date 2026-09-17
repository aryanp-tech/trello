import { useEffect, useState } from 'react'
import { createBoard, deleteBoard, getBoards, updateBoard } from '../services/boardService'

export const useDashboardBoards = () => {

    // state variables for managing boards, loading state, errors, and UI interactions
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuId, setMenuId] = useState(null)
  const [editingBoard, setEditingBoard] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    // fetches the list of boards from the server and updates state accordingly
    getBoards()
      .then((response) => {
        if (active) setBoards(response.data.boards || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load boards')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // for creating a new board
  const openCreate = () => {
    setEditingBoard(null)
    setTitle('')
    setModalOpen(true)
  }

  // for editing an existing board
  const openEdit = (board) => {
    setEditingBoard(board)
    setTitle(board.title)
    setModalOpen(true)
    setMenuId(null)
  }

  // for closing the create/edit board modal and resetting relevant state
  const closeForm = () => {
    setEditingBoard(null)
    setTitle('')
    setModalOpen(false)
  }

  // for handling the save action when creating or editing a board
  const handleSave = async (event) => {
    event.preventDefault()
    if (!title.trim()) return

    try {
      setSaving(true)
      if (editingBoard) {
        const response = await updateBoard(editingBoard._id, { title: title.trim() })
        setBoards((current) => current.map((board) => (
          board._id === editingBoard._id ? response.data.board : board
        )))
      } else {
        const response = await createBoard({ title: title.trim() })
        setBoards((current) => [response.data.board, ...current])
      }
      closeForm()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save board')
    } finally {
      setSaving(false)
    }
  }

  // for handling the deletion of a board and updating state accordingly
  const handleDelete = async (boardId) => {
    try {
      await deleteBoard(boardId)
      setBoards((current) => current.filter((board) => board._id !== boardId))
      setMenuId(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete board')
    }
  }

  return {
    boards,
    loading,
    error,
    menuId,
    editingBoard,
    modalOpen,
    title,
    saving,
    setMenuId,
    setTitle,
    setModalOpen,
    openCreate,
    openEdit,
    closeForm,
    handleSave,
    handleDelete,
  }
}
