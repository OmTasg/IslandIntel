import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  momentumGenreFill,
  momentumGenreStroke,
  sortGenresForMomentumStack,
} from '../../constants/momentumChartStyle.js'
import { SeriesZoomFrame } from '../ui/SeriesZoomFrame.jsx'

const gridStyle = {
  stroke: '#475569',
  strokeOpacity: 0.45,
  strokeDasharray: '0',
}

const axisMuted = {
  stroke: '#64748b',
  tick: { fill: '#94a3b8', fontSize: 11 },
  tickLine: { stroke: '#64748b' },
  axisLine: { stroke: '#64748b' },
}

function formatPlayersK(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return `${Math.round(n)}`
}

function stackedTotal(row, genreKeys) {
  if (!row || !genreKeys.length) return 0
  return genreKeys.reduce((s, g) => s + (Number(row[g]) || 0), 0)
}

function MomentumTooltip({ active, payload, sortedGenres }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const hour =
    row.hourOfWindow != null
      ? `Hour ${row.hourOfWindow} (${row.labelHour ?? ''})`
      : row.labelHour
  const items = sortedGenres.map((g) => {
    const v = Number(row[g]) || 0
    return { genre: g, value: v, fill: momentumGenreFill(g) }
  })
  const total = items.reduce((s, x) => s + x.value, 0)
  return (
    <div className="rounded border border-slate-600 bg-slate-800/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-slate-100">{hour}</p>
      <p className="mb-1.5 text-[11px] text-slate-400">
        Total peak (sum){' '}
        <span className="font-medium text-slate-200">{formatPlayersK(total)}</span>
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
        {items
          .filter((x) => x.value > 0)
          .sort((a, b) => b.value - a.value)
          .map(({ genre, value, fill }) => (
            <li key={genre} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-300">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: fill }}
                />
                {genre}
              </span>
              <span className="tabular-nums text-slate-200">{formatPlayersK(value)}</span>
            </li>
          ))}
      </ul>
    </div>
  )
}

function MomentumChartCanvas({ data, sortedGenres }) {
  const { yMax, yTicks } = useMemo(() => {
    const rows = data ?? []
    let peak = 0
    for (const row of rows) {
      peak = Math.max(peak, stackedTotal(row, sortedGenres))
    }
    if (peak <= 0) return { yMax: 1, yTicks: [0, 1] }
    const step = peak >= 200_000 ? 50_000 : peak >= 50_000 ? 25_000 : peak >= 10_000 ? 5_000 : 1_000
    const niceMax = Math.max(step, Math.ceil(peak / step) * step)
    const ticks = []
    for (let v = 0; v <= niceMax; v += step) ticks.push(v)
    return { yMax: niceMax, yTicks: ticks }
  }, [data, sortedGenres])

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={280}>
      <AreaChart data={data} margin={{ top: 16, right: 16, left: 4, bottom: 56 }}>
        <CartesianGrid {...gridStyle} horizontal vertical />
        <XAxis
          dataKey="hourOfWindow"
          {...axisMuted}
          tickMargin={8}
          label={{
            value: 'Hour of captured at',
            position: 'bottom',
            offset: 0,
            fill: '#94a3b8',
            fontSize: 11,
          }}
        />
        <YAxis
          {...axisMuted}
          domain={[0, yMax]}
          allowDataOverflow
          ticks={yTicks}
          tickFormatter={(v) => formatPlayersK(v)}
          tickMargin={8}
          width={52}
          label={{
            value: 'Players peak',
            angle: -90,
            position: 'insideLeft',
            fill: '#94a3b8',
            fontSize: 11,
            offset: 10,
          }}
        />
        <Tooltip
          content={<MomentumTooltip sortedGenres={sortedGenres} />}
          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          wrapperStyle={{ paddingTop: 20, fontSize: 11 }}
          formatter={(value) => (
            <span className="text-slate-400" style={{ marginRight: 10 }}>
              {value}
            </span>
          )}
        />
        {sortedGenres.map((genre) => {
          const fill = momentumGenreFill(genre)
          const stroke = momentumGenreStroke(fill)
          return (
            <Area
              key={genre}
              type="monotone"
              dataKey={genre}
              name={genre}
              stackId="momentum"
              stroke={stroke}
              fill={fill}
              fillOpacity={0.92}
              strokeWidth={1.25}
              dot={false}
              isAnimationActive={data.length < 80}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MarketShareMomentumChart({ data, genres, height = 400 }) {
  const sortedGenres = sortGenresForMomentumStack(genres ?? [])

  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">
        No momentum data
      </div>
    )
  }

  return (
    <SeriesZoomFrame data={data} height={height}>
      {({ visibleData }) => (
        <MomentumChartCanvas data={visibleData} sortedGenres={sortedGenres} />
      )}
    </SeriesZoomFrame>
  )
}
