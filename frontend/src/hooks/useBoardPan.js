import { useRef } from 'react'

export const useBoardPan = () => {
  const boardScrollRef = useRef(null)
  const panState = useRef({ active: false, startX: 0, startScrollLeft: 0 })

  // handles pointer down event to initiate panning
  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button, input, textarea, section')) return

    panState.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: boardScrollRef.current.scrollLeft,
    }
    boardScrollRef.current.setPointerCapture(event.pointerId)
  }

  // handles pointer move event to update scroll position based on pointer movement
  const handlePointerMove = (event) => {
    if (!panState.current.active) return
    const distance = event.clientX - panState.current.startX
    boardScrollRef.current.scrollLeft = panState.current.startScrollLeft - distance
  }

  // handles pointer up event to end panning
  const handlePointerUp = (event) => {
    if (!panState.current.active) return
    panState.current.active = false
    boardScrollRef.current.releasePointerCapture?.(event.pointerId)
  }

  return {
    boardScrollRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
