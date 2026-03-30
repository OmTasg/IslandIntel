import { memo } from 'react'
import { tooltipProps } from '../../constants/rechartsTheme.js'

const boxClass =
  'rounded-lg border border-slate-600 bg-slate-900/98 px-3 py-2 text-xs shadow-xl max-w-[min(92vw,280px)]'

const MapIdentity = memo(function MapIdentity({ mapName, mapCode }) {
  return (
    <div className="mb-2 border-b border-slate-700 pb-2">
      <p className="font-semibold leading-snug text-slate-100">{mapName || 'Map'}</p>
      {mapCode ? (
        <p className="mt-0.5 font-mono text-[11px] leading-snug text-slate-400" title="Map code">
          {mapCode}
        </p>
      ) : null}
    </div>
  )
})

function rowFromPayload(payload) {
  return payload?.[0]?.payload ?? null
}

export const EngagementScatterTooltip = memo(function EngagementScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = rowFromPayload(payload)
  if (!row) return null
  const d1 = Number(row.retentionD1)
  const d7 = Number(row.retentionD7)
  const mins = Number(row.avgPlaytimeMins)
  return (
    <div className={boxClass} style={tooltipProps.contentStyle}>
      <MapIdentity mapName={row.mapName} mapCode={row.mapCode} />
      <ul className="space-y-1 text-slate-300">
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">Avg playtime</span>
          <span className="tabular-nums text-slate-100">{Number.isFinite(mins) ? `${mins.toFixed(1)} min` : '—'}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">D1 retention</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(d1) ? `${(d1 * 100).toFixed(1)}%` : '—'}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">D7 retention</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(d7) ? `${(d7 * 100).toFixed(1)}%` : '—'}
          </span>
        </li>
        {row.genre ? (
          <li className="flex justify-between gap-4 border-t border-slate-700 pt-1.5">
            <span className="text-slate-500">Genre</span>
            <span className="text-right text-slate-200">{row.genre}</span>
          </li>
        ) : null}
      </ul>
    </div>
  )
})

export const ViabilityScatterTooltip = memo(function ViabilityScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = rowFromPayload(payload)
  if (!row) return null
  const peak = Number(row.playersPeak)
  const d1 = Number(row.retentionD1)
  const mins = Number(row.avgPlaytimeMins)
  return (
    <div className={boxClass} style={tooltipProps.contentStyle}>
      <MapIdentity mapName={row.mapName} mapCode={row.mapCode} />
      <ul className="space-y-1 text-slate-300">
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">Peak players</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(peak) ? peak.toLocaleString() : '—'}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">Avg playtime</span>
          <span className="tabular-nums text-slate-100">{Number.isFinite(mins) ? `${mins.toFixed(1)} min` : '—'}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">D1 retention</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(d1) ? `${(d1 * 100).toFixed(1)}%` : '—'}
          </span>
        </li>
      </ul>
    </div>
  )
})

export const GenreScatterTooltip = memo(function GenreScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = rowFromPayload(payload)
  if (!row) return null
  const peak = Number(row.playersPeak)
  const d1 = Number(row.retentionD1)
  return (
    <div className={boxClass} style={tooltipProps.contentStyle}>
      <MapIdentity mapName={row.mapName} mapCode={row.mapCode} />
      <ul className="space-y-1 text-slate-300">
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">Genre</span>
          <span className="text-right text-slate-200">{row.genre ?? '—'}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">Peak players</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(peak) ? peak.toLocaleString() : '—'}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-slate-500">D1 retention</span>
          <span className="tabular-nums text-slate-100">
            {Number.isFinite(d1) ? `${(d1 * 100).toFixed(1)}%` : '—'}
          </span>
        </li>
      </ul>
    </div>
  )
})
