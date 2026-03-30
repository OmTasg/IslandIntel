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
import { colorAt } from '../../constants/chartTheme.js'
import { SCATTER_CURSOR, SCATTER_MARGIN_DEFAULT } from '../../constants/scatterChartConstants.js'
import { ScatterZoomFrame } from '../ui/ScatterZoomFrame.jsx'
import { EngagementScatterTooltip } from './ScatterPointTooltip.jsx'

const EngagementScatterCanvas = memo(function EngagementScatterCanvas({ xDomain, yDomain, visibleData, genreLabels }) {
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
    for (let i = 0; i < visibleData.length; i++) {
      const d = visibleData[i]
      sx += Number(d.avgPlaytimeMins) || 0
      sy += Number(d.retentionD1) || 0
    }
    return { avgX: sx / n, avgY: sy / n }
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
          dataKey="retentionD1"
          name="D1 retention"
          domain={yDomain}
          allowDataOverflow
          tickFormatter={(v) => `${Math.round(v * 100)}%`}
          {...axisProps}
        />
        <ZAxis type="number" dataKey="retentionD7" range={[80, 520]} name="D7 retention" />
        <Tooltip
          content={(props) => <EngagementScatterTooltip {...props} />}
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

export function EngagementMatrixChart({ data, height = 300, genreLabels }) {
  return (
    <ScatterZoomFrame
      data={data}
      xKey="avgPlaytimeMins"
      yKey="retentionD1"
      yScale="linear"
      height={height}
    >
      {({ xDomain, yDomain, visibleData }) => (
        <EngagementScatterCanvas xDomain={xDomain} yDomain={yDomain} visibleData={visibleData} genreLabels={genreLabels} />
      )}
    </ScatterZoomFrame>
  )
}
