import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const ZOOM_IN_FACTOR = 0.82
const ZOOM_OUT_FACTOR = 1.18

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * Zoom/pan along array index (time series / bar rows). Wheel changes visible row range; drag pans.
 */
export function useIndexRangeZoom(n) {
  const full = useMemo(() => ({ i0: 0, i1: Math.max(0, n - 1) }), [n])

  const minSpan = useMemo(() => {
    if (n <= 1) return 1
    return Math.max(2, Math.floor(n * 0.04) || 2)
  }, [n])

  const [view, setView] = useState(() => ({ ...full }))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when row count changes
    setView({ i0: 0, i1: Math.max(0, n - 1) })
  }, [n])

  const viewRef = useRef(view)
  useLayoutEffect(() => {
    viewRef.current = view
  }, [view])

  const reset = useCallback(() => {
    setView({ i0: 0, i1: Math.max(0, n - 1) })
  }, [n])

  const zoomAt = useCallback(
    (nx, zoomIn) => {
      if (n < 2) return
      const cur = viewRef.current
      let { i0, i1 } = cur
      const span = i1 - i0 + 1
      const factor = zoomIn ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR
      let newSpan = Math.max(minSpan, Math.round(span * factor))
      newSpan = Math.min(newSpan, n)
      const center = i0 + nx * (span - 1)
      let newI0 = Math.round(center - nx * (newSpan - 1))
      newI0 = clamp(newI0, 0, n - newSpan)
      const newI1 = newI0 + newSpan - 1
      setView({ i0: newI0, i1: newI1 })
    },
    [n, minSpan]
  )

  const panBy = useCallback(
    (fracX) => {
      if (n < 2) return
      const cur = viewRef.current
      let { i0, i1 } = cur
      const span = i1 - i0 + 1
      const delta = Math.round(-fracX * span)
      const newI0 = clamp(i0 + delta, 0, n - span)
      const newI1 = newI0 + span - 1
      setView({ i0: newI0, i1: newI1 })
    },
    [n]
  )

  const isZoomed = useMemo(() => view.i0 !== full.i0 || view.i1 !== full.i1, [view, full])

  return {
    i0: view.i0,
    i1: view.i1,
    isZoomed,
    reset,
    zoomAt,
    panBy,
  }
}

const PLOT_PAD_X = 0.06

function eventToNormX(e, rect) {
  const fx = (e.clientX - rect.left) / rect.width
  return clamp((fx - PLOT_PAD_X) / (1 - 2 * PLOT_PAD_X), 0, 1)
}

export function useSeriesZoomPointerHandlers(containerRef, { zoomAt, panBy, reset }) {
  const drag = useRef(null)
  const [dragging, setDragging] = useState(false)

  const resetSafe = useCallback(
    (e) => {
      if (e) {
        e.preventDefault?.()
        e.stopPropagation?.()
      }
      drag.current = null
      setDragging(false)
      reset()
    },
    [reset]
  )

  const onWheel = useCallback(
    (e) => {
      const el = containerRef.current
      if (!el) return
      e.preventDefault()
      const zoomIn = e.deltaY < 0
      const nx = eventToNormX(e, el.getBoundingClientRect())
      zoomAt(nx, zoomIn)
    },
    [containerRef, zoomAt]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [containerRef, onWheel])

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    const t = e.target
    if (t && typeof t.closest === 'function' && t.closest('[data-zoomreset="true"]')) {
      // Don't start a pan when interacting with the reset button.
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }, [])

  const onPointerMove = useCallback(
    (e) => {
      const d = drag.current
      if (!d) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - d.x
      d.x = e.clientX
      d.y = e.clientY
      panBy(dx / rect.width)
    },
    [containerRef, panBy]
  )

  const onPointerUp = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    drag.current = null
    setDragging(false)
  }, [])

  const onDoubleClick = useCallback(
    (e) => {
      e.preventDefault()
      resetSafe(e)
    },
    [resetSafe]
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onDoubleClick,
    resetSafe,
    style: { touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' },
  }
}
