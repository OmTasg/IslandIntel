import { memo, useCallback, useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { axisProps, gridProps } from '../../constants/rechartsTheme.js'
import { SCATTER_CURSOR, SCATTER_MARGIN_DEFAULT } from '../../constants/scatterChartConstants.js'
import { colorAt } from '../../constants/chartTheme.js'
import { ScatterZoomFrame } from '../ui/ScatterZoomFrame.jsx'
import { ViabilityScatterTooltip } from './ScatterPointTooltip.jsx'

const ViabilityScatterCanvas = memo(function ViabilityScatterCanvas({ xDomain, yDomain, visibleData, genreLabels }) {
  const genreToIndex = useMemo(() => {
    const m = new Map()
    for (let i = 0; i < (genreLabels?.length ?? 0); i++) m.set(genreLabels[i], i)
    return m
  }, [genreLabels])

  const averages = useMemo(() => {
    const n = visibleData.length || 0
    if (!n) return { avgX: null, avgY: null }
    let sx = 0
    let sy = 0
    let validYCount = 0
    for (let i = 0; i < visibleData.length; i++) {
      const d = visibleData[i]
      const x = Number(d.avgPlaytimeMins)
      if (Number.isFinite(x)) sx += x
      const y = Number(d.playersPeak)
      if (Number.isFinite(y) && y > 0) {
        sy += y
        validYCount++
      }
    }
    return { avgX: sx / n, avgY: validYCount ? sy / validYCount : null }
  }, [visibleData])

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
      <ScatterChart margin={SCATTER_MARGIN_DEFAULT}>
        <CartesianGrid {...gridProps} />
        <XAxis
          type="number"
          dataKey="avgPlaytimeMins"
          name="Avg playtime"
          unit=" min"
          domain={xDomain}
          allowDataOverflow
          {...axisProps}
        />
        <YAxis
          type="number"
          dataKey="playersPeak"
          scale="log"
          domain={yDomain}
          allowDataOverflow
          name="Peak players"
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
          {...axisProps}
        />
        <ZAxis type="number" dataKey="retentionD1" range={[120, 480]} name="D1 retention" />
        <Tooltip
          content={(props) => <ViabilityScatterTooltip {...props} />}
          cursor={SCATTER_CURSOR}
          isAnimationActive={false}
        />
        {averages.avgX != null ? (
          <ReferenceLine
            x={averages.avgX}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: 'Average', position: 'insideBottomRight', fill: '#94a3b8', fontSize: 11 }}
          />
        ) : null}
        {averages.avgY != null ? (
          <ReferenceLine
            y={averages.avgY}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: 'Average', position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
        ) : null}
        <Scatter
          name="Maps"
          data={visibleData}
          shape={dotShape}
          isAnimationActive={false}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
})

export function ViabilityMatrixChart({ data, height = 300, genreLabels }) {
  return (
    <ScatterZoomFrame
      data={data}
      xKey="avgPlaytimeMins"
      yKey="playersPeak"
      yScale="log"
      height={height}
    >
      {({ xDomain, yDomain, visibleData }) => (
        <ViabilityScatterCanvas
          xDomain={xDomain}
          yDomain={yDomain}
          visibleData={visibleData}
          genreLabels={genreLabels}
        />
      )}
    </ScatterZoomFrame>
  )
}
