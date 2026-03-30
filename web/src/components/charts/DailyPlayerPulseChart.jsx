import { useId, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { axisProps, gridProps, tooltipProps } from '../../constants/rechartsTheme.js'
import { SeriesZoomFrame } from '../ui/SeriesZoomFrame.jsx'

function PulseChartCanvas({ visibleData, gradId }) {
  const yMax = useMemo(() => {
    let m = 0
    for (const d of visibleData) {
      m = Math.max(m, Number(d.playersPeak) || 0)
    }
    return m > 0 ? Math.ceil(m * 1.08) : 1
  }, [visibleData])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={visibleData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id={`pulseFill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="labelHour" {...axisProps} />
        <YAxis
          domain={[0, yMax]}
          allowDataOverflow
          {...axisProps}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
        />
        <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString(), 'Peak players']} />
        <Area
          type="monotone"
          dataKey="playersPeak"
          stroke="#22d3ee"
          strokeWidth={2}
          fill={`url(#pulseFill-${gradId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: '#e0f2fe' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DailyPlayerPulseChart({ data, height = 340 }) {
  const gradId = useId().replace(/:/g, '')

  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">
        No time-series data
      </div>
    )
  }

  return (
    <SeriesZoomFrame data={data} height={height}>
      {({ visibleData }) => <PulseChartCanvas visibleData={visibleData} gradId={gradId} />}
    </SeriesZoomFrame>
  )
}
