import { useMemo, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { useIndexRangeZoom, useSeriesZoomPointerHandlers } from '../../hooks/useIndexRangeZoom.js'

/**
 * Tableau-style zoom for row-based charts: wheel changes which rows are visible (not CSS scale).
 */
export function SeriesZoomFrame({ data, height, overflowX = 'hidden', children }) {
  const n = data?.length ?? 0
  const containerRef = useRef(null)
  const zoom = useIndexRangeZoom(n)
  const visibleData = useMemo(() => (n ? data.slice(zoom.i0, zoom.i1 + 1) : []), [data, n, zoom.i0, zoom.i1])
  const pointer = useSeriesZoomPointerHandlers(containerRef, {
    zoomAt: zoom.zoomAt,
    panBy: zoom.panBy,
    reset: zoom.reset,
  })

  if (!n) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md [&_.recharts-responsive-container]:h-full [&_.recharts-responsive-container]:w-full"
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
      <div
        className={`h-full w-full ${overflowX === 'auto' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`}
      >
        {children({
          visibleData,
          reset: zoom.reset,
          isZoomed: zoom.isZoomed,
          startIndex: zoom.i0,
        })}
      </div>
    </div>
  )
}
