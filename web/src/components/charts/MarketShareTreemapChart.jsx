import { useMemo } from 'react'
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts'
import { colorAt } from '../../constants/chartTheme.js'
import { tooltipProps } from '../../constants/rechartsTheme.js'

function IslandTreemapContent(props) {
  const { x, y, width, height, index, name, value, payload } = props
  if (width < 6 || height < 6) return null
  const label = name ?? payload?.name
  const raw = value ?? payload?.size
  const fill = colorAt(typeof index === 'number' ? index : 0)
  const area = width * height
  const big = area > 55_000
  const mid = !big && area > 20_000
  // If a tile is too narrow/small, it’s better to show its genre via hover tooltip
  // instead of rendering cramped numbers/labels (which looks “random”).
  const showInlineGenre = area >= 22_000 && width >= 70
  // Inline numeric values are the source of the “random big number” look.
  // Hide them for everything except very large tiles; rely on hover tooltip otherwise.
  const showInlineValue = area >= 80_000 && width >= 120
  const titleSize = big ? 16 : mid ? 13 : 11
  const valueSize = big ? 12 : 10
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill }}
        fillOpacity={0.78}
        stroke="#0f172a"
        strokeWidth={1}
        rx={6}
        ry={6}
      />
      {showInlineGenre ? (
        <text
          x={x + width / 2}
          y={showInlineValue ? y + height / 2 - 7 : y + height / 2 + 2}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={titleSize}
          fontWeight={700}
          fontFamily="Inter, Segoe UI, system-ui, sans-serif"
          letterSpacing={0.2}
          style={{ textShadow: '0 1px 2px rgba(15,23,42,0.85)' }}
        >
          {label}
        </text>
      ) : null}
      {showInlineValue ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 11}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize={valueSize}
          fontFamily="Inter, Segoe UI, system-ui, sans-serif"
        >
          {typeof raw === 'number' ? raw.toLocaleString() : raw}
        </text>
      ) : null}
    </g>
  )
}

function TreemapGenreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div
      style={tooltipProps.contentStyle}
      className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
    >
      <p className="font-semibold text-slate-100">{row.name ?? 'Genre'}</p>
      <p className="mt-1 text-slate-300">
        Total playtime mins:{' '}
        <span className="font-medium text-slate-100">
          {Number(row.size ?? 0).toLocaleString()}
        </span>
      </p>
    </div>
  )
}

export function MarketShareTreemapChart({ data }) {
  const sorted = useMemo(() => {
    if (!data?.length) return []
    return [...data].sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={sorted}
        dataKey="size"
        nameKey="name"
        stroke="#0f172a"
        content={<IslandTreemapContent />}
        animationDuration={400}
      >
        <Tooltip content={(props) => <TreemapGenreTooltip {...props} />} isAnimationActive={false} />
      </Treemap>
    </ResponsiveContainer>
  )
}
