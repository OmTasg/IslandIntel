import { useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { useScatterDataZoom, useScatterZoomPointerHandlers } from '../../hooks/useScatterDataZoom.js'

/**
 * Tableau-style zoom: changes axis domains so dense points separate; wheel zooms data range,
 * drag pans, double-click resets. View is clamped to data extents (no zoom-out past the graph).
 */
export function ScatterZoomFrame({ data, xKey, yKey, yScale = 'linear', xExtentFull, yExtentFull, height, children }) {
  const containerRef = useRef(null)
  const zoom = useScatterDataZoom({ data, xKey, yKey, yScale, xExtentFull, yExtentFull })
  const pointer = useScatterZoomPointerHandlers(containerRef, {
    zoomAt: zoom.zoomAt,
    panBy: zoom.panBy,
    reset: zoom.reset,
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md outline-none [&_.recharts-responsive-container]:h-full [&_.recharts-responsive-container]:w-full"
      style={{ height, ...pointer.style }}
      onPointerDown={pointer.onPointerDown}
      onPointerMove={pointer.onPointerMove}
      onPointerUp={pointer.onPointerUp}
      onPointerLeave={pointer.onPointerLeave}
      onDoubleClick={pointer.onDoubleClick}
      role="presentation"
    >
      {zoom.isZoomed ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-900/95 px-2 py-1 text-[11px] font-medium text-slate-200 shadow-md hover:bg-slate-800"
          onClick={pointer.resetSafe}
          data-zoomreset="true"
          onPointerDown={(e) => e.stopPropagation()}
          onClickCapture={(e) => e.stopPropagation()}
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          Reset
        </button>
      ) : null}
      {children({
        xDomain: zoom.xDomain,
        yDomain: zoom.yDomain,
        visibleData: zoom.visibleData,
      })}
    </div>
  )
}
