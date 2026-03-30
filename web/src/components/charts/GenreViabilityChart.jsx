import { memo, useCallback, useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { axisProps, gridProps } from '../../constants/rechartsTheme.js'
import { SCATTER_CURSOR, SCATTER_MARGIN_GENRE } from '../../constants/scatterChartConstants.js'
import { ScatterZoomFrame } from '../ui/ScatterZoomFrame.jsx'
import { GenreScatterTooltip } from './ScatterPointTooltip.jsx'
import { colorAt } from '../../constants/chartTheme.js'

function ticksInView(xDomain, genreLabels) {
  const [a, b] = xDomain
  const raw = genreLabels.map((_, i) => i).filter((i) => i >= a - 0.45 && i <= b + 0.45)
  if (raw.length > 0) return raw
  const mid = Math.round((a + b) / 2)
  const idx = Math.max(0, Math.min(genreLabels.length - 1, mid))
  return [idx]
}

const GenreViabilityCanvas = memo(function GenreViabilityCanvas({ xDomain, yDomain, visibleData, genreLabels }) {
  const ticks = useMemo(() => ticksInView(xDomain, genreLabels), [xDomain, genreLabels])

  const genreToIndex = useMemo(() => {
    const m = new Map()
    for (let i = 0; i < (genreLabels?.length ?? 0); i++) m.set(genreLabels[i], i)
    return m
  }, [genreLabels])

  const dotShape = useCallback(
    (props) => {
      const { cx, cy, payload, width } = props
      if (cx == null || cy == null) return null
      const r = width != null && Number.isFinite(width) ? Math.max(2, width / 2) : 4
      const idx = genreToIndex.get(payload?.genre) ?? 0
      const fill = colorAt(idx)
      return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />
    },
    [genreToIndex]
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={SCATTER_MARGIN_GENRE}>
        <CartesianGrid {...gridProps} />
        <XAxis
          type="number"
          dataKey="genreIndex"
          domain={xDomain}
          allowDataOverflow
          ticks={ticks}
          tickFormatter={(v) => genreLabels[Math.round(v)] ?? ''}
          interval={0}
          {...axisProps}
        />
        <YAxis
          type="number"
          dataKey="playersPeak"
          scale="log"
          domain={yDomain}
          allowDataOverflow
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
          {...axisProps}
        />
        <ZAxis type="number" dataKey="retentionD1" range={[64, 360]} name="D1" />
        <Tooltip
          content={(props) => <GenreScatterTooltip {...props} />}
          cursor={SCATTER_CURSOR}
          isAnimationActive={false}
        />
        <Scatter name="Maps" data={visibleData} shape={dotShape} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  )
})

export function GenreViabilityChart({ data, genreLabels, height = 300 }) {
  const n = genreLabels.length || 1
  const domainMax = Math.max(n - 1, 0)
  const xExtentFull = useMemo(() => [-0.35, domainMax + 0.35], [domainMax])

  return (
    <ScatterZoomFrame
      data={data}
      xKey="genreIndex"
      yKey="playersPeak"
      yScale="log"
      xExtentFull={xExtentFull}
      height={height}
    >
      {({ xDomain, yDomain, visibleData }) => (
        <GenreViabilityCanvas
          xDomain={xDomain}
          yDomain={yDomain}
          visibleData={visibleData}
          genreLabels={genreLabels}
        />
      )}
    </ScatterZoomFrame>
  )
}
