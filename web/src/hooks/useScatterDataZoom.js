import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

/** Zoom in / out per wheel step (Tableau-like: axis range changes, not bitmap scale). */
const ZOOM_IN_FACTOR = 0.82
const ZOOM_OUT_FACTOR = 1.18

function clamp(n, lo, hi) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return n
  if (hi < lo) return lo
  return Math.min(hi, Math.max(lo, n))
}

function nearlyEqual(a, b, eps) {
  return Math.abs(a - b) <= eps
}

/** Min/max X and Y in one pass — avoids allocating per-row arrays on every memo recompute. */
function computeExtentsFromRows(rows, xKey, yKey, yScale) {
  let xMin = Infinity
  let xMax = -Infinity
  let yMin = Infinity
  let yMax = -Infinity
  for (let i = 0; i < rows.length; i++) {
    const d = rows[i]
    const x = Number(d?.[xKey])
    const y = Number(d?.[yKey])
    if (Number.isFinite(x)) {
      xMin = Math.min(xMin, x)
      xMax = Math.max(xMax, x)
    }
    if (Number.isFinite(y)) {
      if (yScale === 'log') {
        if (y > 0) {
          yMin = Math.min(yMin, y)
          yMax = Math.max(yMax, y)
        }
      } else {
        yMin = Math.min(yMin, y)
        yMax = Math.max(yMax, y)
      }
    }
  }
  return { xMin, xMax, yMin, yMax }
}

function tightLinearExtent(lo, hi) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1]
  if (nearlyEqual(lo, hi, 1e-12)) {
    const d = Math.abs(lo) || 1
    return [lo - d * 1e-6, hi + d * 1e-6]
  }
  return [lo, hi]
}

function tightLogYExtent(yMin, yMax) {
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return [1, 10]
  if (yMin <= 0 || yMax <= 0) return [1, 10]
  if (nearlyEqual(yMin, yMax, 1e-12)) {
    return [yMin * 0.9999, yMax * 1.0001]
  }
  return [yMin, yMax]
}

/**
 * Points whose coordinates fall inside the current axis viewport (fewer nodes for Recharts).
 */
export function filterViewportPoints(data, xKey, yKey, yScale, x0, x1, y0, y1) {
  if (!data?.length) return []
  const epsX = Math.max(1e-12, (x1 - x0) * 1e-10)
  const epsY = Math.max(1e-12, (y1 - y0) * 1e-10)
  const out = []
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const x = Number(row?.[xKey])
    const y = Number(row?.[yKey])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (yScale === 'log' && y <= 0) continue
    if (x < x0 - epsX || x > x1 + epsX) continue
    if (y < y0 - epsY || y > y1 + epsY) continue
    out.push(row)
  }
  return out
}

/** Recharts log scale throws if domain includes ≤0, NaN, or equal endpoints. */
function sanitizeAxisDomains(view, full, yScale) {
  let { x0, x1, y0, y1 } = view
  const fx = full.x1 - full.x0
  const fy = full.y1 - full.y0
  const epsX = Math.max(fx * 1e-9, 1e-12)
  const epsY = Math.max(fy * 1e-9, 1e-12)

  if (!Number.isFinite(x0) || !Number.isFinite(x1)) {
    x0 = full.x0
    x1 = full.x1
  }
  if (x1 <= x0) {
    x1 = x0 + epsX
  }

  if (!Number.isFinite(y0) || !Number.isFinite(y1)) {
    y0 = full.y0
    y1 = full.y1
  }
  if (yScale === 'log') {
    y0 = Math.max(y0, 1e-100)
    y1 = Math.max(y1, y0 * 1.0000001)
  }
  if (y1 <= y0) {
    y1 = y0 + epsY
  }

  return { x0, x1, y0, y1 }
}

/**
 * @param {object} opts
 * @param {unknown[]} opts.data
 * @param {string} opts.xKey
 * @param {string} opts.yKey
 * @param {'linear'|'log'} [opts.yScale]
 * @param {[number, number] | null} [opts.xExtentFull]
 * @param {[number, number] | null} [opts.yExtentFull]
 */
export function useScatterDataZoom({ data, xKey, yKey, yScale = 'linear', xExtentFull: xFullOverride, yExtentFull: yFullOverride }) {
  const rows = useMemo(() => data ?? [], [data])

  const full = useMemo(() => {
    if (xFullOverride && yFullOverride) {
      return { x0: xFullOverride[0], x1: xFullOverride[1], y0: yFullOverride[0], y1: yFullOverride[1] }
    }
    if (xFullOverride) {
      const { yMin, yMax } = computeExtentsFromRows(rows, xKey, yKey, yScale)
      const yExt = yScale === 'log' ? tightLogYExtent(yMin, yMax) : tightLinearExtent(yMin, yMax)
      return { x0: xFullOverride[0], x1: xFullOverride[1], y0: yExt[0], y1: yExt[1] }
    }
    if (yFullOverride) {
      const { xMin, xMax } = computeExtentsFromRows(rows, xKey, yKey, yScale)
      const xExt = tightLinearExtent(xMin, xMax)
      return { x0: xExt[0], x1: xExt[1], y0: yFullOverride[0], y1: yFullOverride[1] }
    }

    const { xMin, xMax, yMin, yMax } = computeExtentsFromRows(rows, xKey, yKey, yScale)
    const xExt = tightLinearExtent(xMin, xMax)
    const yExt = yScale === 'log' ? tightLogYExtent(yMin, yMax) : tightLinearExtent(yMin, yMax)
    return { x0: xExt[0], x1: xExt[1], y0: yExt[0], y1: yExt[1] }
  }, [rows, xKey, yKey, yScale, xFullOverride, yFullOverride])

  const minSpan = useMemo(() => {
    const xr = full.x1 - full.x0
    const yr = full.y1 - full.y0
    return {
      x: Math.max(xr * 0.002, xr * 1e-9 || 1e-12),
      y: Math.max(yr * 0.002, yr * 1e-9 || 1e-12),
    }
  }, [full])

  const [view, setView] = useState(() => sanitizeAxisDomains({ ...full }, full, yScale))

  useEffect(() => {
    const next = sanitizeAxisDomains(
      { x0: full.x0, x1: full.x1, y0: full.y0, y1: full.y1 },
      full,
      yScale
    )
    setView(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- use extent scalars only, not full object identity
  }, [full.x0, full.x1, full.y0, full.y1, yScale])

  const fullRef = useRef(full)
  const viewRef = useRef(view)

  useLayoutEffect(() => {
    fullRef.current = full
  }, [full])
  useLayoutEffect(() => {
    viewRef.current = view
  }, [view])

  const reset = useCallback(() => {
    const f = fullRef.current
    setView(sanitizeAxisDomains({ x0: f.x0, x1: f.x1, y0: f.y0, y1: f.y1 }, f, yScale))
  }, [yScale])

  const clampToFull = useCallback(
    (v) => {
      const f = fullRef.current
      let { x0, x1, y0, y1 } = v
      const xf = f.x1 - f.x0
      const yf = f.y1 - f.y0

      let xSpan = Math.max(x1 - x0, minSpan.x)
      let ySpan = Math.max(y1 - y0, minSpan.y)
      xSpan = Math.min(xSpan, xf)
      ySpan = Math.min(ySpan, yf)

      x0 = clamp(x0, f.x0, f.x1 - xSpan)
      x1 = x0 + xSpan
      y0 = clamp(y0, f.y0, f.y1 - ySpan)
      y1 = y0 + ySpan

      if (x1 > f.x1) {
        x1 = f.x1
        x0 = f.x1 - xSpan
      }
      if (x0 < f.x0) {
        x0 = f.x0
        x1 = x0 + xSpan
      }
      if (y1 > f.y1) {
        y1 = f.y1
        y0 = f.y1 - ySpan
      }
      if (y0 < f.y0) {
        y0 = f.y0
        y1 = y0 + ySpan
      }

      return { x0, x1, y0, y1 }
    },
    [minSpan]
  )

  const zoomAt = useCallback(
    (nx, ny, zoomIn) => {
      const cur = viewRef.current
      const f = fullRef.current
      const factor = zoomIn ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR
      const xSpan = cur.x1 - cur.x0
      const ySpan = cur.y1 - cur.y0
      const fx = cur.x0 + nx * xSpan
      let fy =
        yScale === 'log'
          ? 10 ** (Math.log10(Math.max(cur.y0, 1e-100)) + ny * (Math.log10(Math.max(cur.y1, 1e-100)) - Math.log10(Math.max(cur.y0, 1e-100))))
          : cur.y0 + ny * ySpan

      let newX0
      let newX1
      let newY0
      let newY1

      if (yScale === 'log') {
        const yLo = Math.max(cur.y0, 1e-100)
        const yHi = Math.max(cur.y1, yLo * 1.0000001)
        const logY0 = Math.log10(yLo)
        const logY1 = Math.log10(yHi)
        const logSpan = logY1 - logY0
        fy = Math.max(fy, 1e-100)
        const logFy = Math.log10(fy)
        if (!Number.isFinite(logFy) || !Number.isFinite(logSpan)) {
          setView(sanitizeAxisDomains({ x0: f.x0, x1: f.x1, y0: f.y0, y1: f.y1 }, f, yScale))
          return
        }
        const newLogSpan = logSpan * factor
        const t = logSpan > 0 ? (logFy - logY0) / logSpan : 0.5
        const nLo = logFy - t * newLogSpan
        const nHi = logFy + (1 - t) * newLogSpan
        newY0 = 10 ** nLo
        newY1 = 10 ** nHi
      } else {
        const newYSpan = ySpan * factor
        const t = ySpan > 0 ? (fy - cur.y0) / ySpan : 0.5
        newY0 = fy - t * newYSpan
        newY1 = fy + (1 - t) * newYSpan
      }

      const newXSpan = xSpan * factor
      const tx = xSpan > 0 ? (fx - cur.x0) / xSpan : 0.5
      newX0 = fx - tx * newXSpan
      newX1 = fx + (1 - tx) * newXSpan

      const next = clampToFull({ x0: newX0, x1: newX1, y0: newY0, y1: newY1 })
      setView(sanitizeAxisDomains(next, f, yScale))
    },
    [clampToFull, yScale]
  )

  const panBy = useCallback(
    (fracX, fracY) => {
      const cur = viewRef.current
      const f = fullRef.current
      const xSpan = cur.x1 - cur.x0
      const ySpan = cur.y1 - cur.y0
      let newX0 = cur.x0 - fracX * xSpan
      let newX1 = cur.x1 - fracX * xSpan
      let newY0
      let newY1
      if (yScale === 'log') {
        const yLo = Math.max(cur.y0, 1e-100)
        const yHi = Math.max(cur.y1, yLo * 1.0000001)
        const log0 = Math.log10(yLo)
        const log1 = Math.log10(yHi)
        const logSpan = log1 - log0
        if (!Number.isFinite(logSpan) || logSpan <= 0) {
          setView(sanitizeAxisDomains({ x0: f.x0, x1: f.x1, y0: f.y0, y1: f.y1 }, f, yScale))
          return
        }
        const dLog = fracY * logSpan
        newY0 = 10 ** (log0 - dLog)
        newY1 = 10 ** (log1 - dLog)
      } else {
        newY0 = cur.y0 - fracY * ySpan
        newY1 = cur.y1 - fracY * ySpan
      }
      const next = clampToFull({ x0: newX0, x1: newX1, y0: newY0, y1: newY1 })
      setView(sanitizeAxisDomains(next, f, yScale))
    },
    [clampToFull, yScale]
  )

  const isZoomed = useMemo(() => {
    const eps = (full.x1 - full.x0) * 0.002 + 1e-12
    const epsY = (full.y1 - full.y0) * 0.002 + 1e-12
    return (
      !nearlyEqual(view.x0, full.x0, eps) ||
      !nearlyEqual(view.x1, full.x1, eps) ||
      !nearlyEqual(view.y0, full.y0, epsY) ||
      !nearlyEqual(view.y1, full.y1, epsY)
    )
  }, [view, full])

  const sanitizedView = useMemo(() => sanitizeAxisDomains(view, full, yScale), [view, full, yScale])

  const xDomain = useMemo(() => [sanitizedView.x0, sanitizedView.x1], [sanitizedView])
  const yDomain = useMemo(() => [sanitizedView.y0, sanitizedView.y1], [sanitizedView])

  const visibleData = useMemo(
    () =>
      filterViewportPoints(
        rows,
        xKey,
        yKey,
        yScale,
        sanitizedView.x0,
        sanitizedView.x1,
        sanitizedView.y0,
        sanitizedView.y1
      ),
    [rows, xKey, yKey, yScale, sanitizedView]
  )

  return {
    xDomain,
    yDomain,
    visibleData,
    full,
    isZoomed,
    reset,
    zoomAt,
    panBy,
  }
}

const PLOT_PAD_X = 0.06
const PLOT_PAD_Y = 0.1

function eventToNorm(e, rect) {
  const fx = (e.clientX - rect.left) / rect.width
  const fy = (e.clientY - rect.top) / rect.height
  const nx = clamp((fx - PLOT_PAD_X) / (1 - 2 * PLOT_PAD_X), 0, 1)
  const ny = clamp((fy - PLOT_PAD_Y) / (1 - 2 * PLOT_PAD_Y), 0, 1)
  return { nx, ny: 1 - ny }
}

/**
 * Wheel (non-passive) + drag-to-pan + double-click reset on the chart container.
 */
export function useScatterZoomPointerHandlers(containerRef, { zoomAt, panBy, reset }) {
  const drag = useRef(null)
  const [dragging, setDragging] = useState(false)
  const wheelRaf = useRef(null)
  const pendingWheel = useRef(null)
  const panRafInner = useRef(null)
  const panAccum = useRef({ fx: 0, fy: 0 })

  const flushWheel = useCallback(() => {
    wheelRaf.current = null
    const p = pendingWheel.current
    pendingWheel.current = null
    if (p) zoomAt(p.nx, p.ny, p.zoomIn)
  }, [zoomAt])

  const cancelAllQueued = useCallback(() => {
    if (wheelRaf.current) {
      cancelAnimationFrame(wheelRaf.current)
      wheelRaf.current = null
    }
    pendingWheel.current = null
    if (panRafInner.current) {
      cancelAnimationFrame(panRafInner.current)
      panRafInner.current = null
    }
    panAccum.current = { fx: 0, fy: 0 }
  }, [])

  const resetSafe = useCallback(
    (e) => {
      if (e) {
        // Prevent reset interactions from being interpreted as pan/drag.
        e.preventDefault?.()
        e.stopPropagation?.()
      }
      cancelAllQueued()
      drag.current = null
      setDragging(false)
      reset()
    },
    [cancelAllQueued, reset]
  )

  const onWheel = useCallback(
    (e) => {
      const el = containerRef.current
      if (!el) return
      e.preventDefault()
      const zoomIn = e.deltaY < 0
      const { nx, ny } = eventToNorm(e, el.getBoundingClientRect())
      pendingWheel.current = { nx, ny, zoomIn }
      if (wheelRaf.current == null) {
        wheelRaf.current = requestAnimationFrame(flushWheel)
      }
    },
    [containerRef, flushWheel]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (wheelRaf.current) cancelAnimationFrame(wheelRaf.current)
    }
  }, [containerRef, onWheel])

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    const t = e.target
    if (t && typeof t.closest === 'function' && t.closest('[data-zoomreset="true"]')) {
      // Prevent reset button clicks from starting a pan/drag interaction.
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }, [])

  const flushPan = useCallback(() => {
    panRafInner.current = null
    const { fx, fy } = panAccum.current
    panAccum.current = { fx: 0, fy: 0 }
    if (fx !== 0 || fy !== 0) panBy(fx, fy)
  }, [panBy])

  const onPointerMove = useCallback(
    (e) => {
      const d = drag.current
      if (!d) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      d.x = e.clientX
      d.y = e.clientY
      panAccum.current.fx += dx / rect.width
      panAccum.current.fy += dy / rect.height
      if (panRafInner.current == null) {
        panRafInner.current = requestAnimationFrame(flushPan)
      }
    },
    [containerRef, flushPan]
  )

  const onPointerUp = useCallback(
    (e) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      drag.current = null
      setDragging(false)
      if (panRafInner.current) {
        cancelAnimationFrame(panRafInner.current)
        panRafInner.current = null
      }
      flushPan()
    },
    [flushPan]
  )

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
