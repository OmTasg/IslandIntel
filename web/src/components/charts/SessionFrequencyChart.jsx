import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colorAt } from '../../constants/chartTheme.js'
import { axisProps, gridProps, tooltipProps } from '../../constants/rechartsTheme.js'
import { SeriesZoomFrame } from '../ui/SeriesZoomFrame.jsx'

const BAR_SLOT = 56

export function SessionFrequencyChart({ data, height = 320 }) {
  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-500">
        No session frequency data
      </div>
    )
  }

  return (
    <SeriesZoomFrame data={data} height={height} overflowX="auto">
      {({ visibleData, startIndex }) => (
        <div style={{ minWidth: Math.max(visibleData.length * BAR_SLOT, 400), height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visibleData} margin={{ top: 8, right: 12, left: 4, bottom: 52 }}>
              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="genre"
                interval={0}
                angle={-22}
                textAnchor="end"
                height={56}
                {...axisProps}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis {...axisProps} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip
                {...tooltipProps}
                formatter={(v) => [Number(v).toFixed(2), 'Plays / player']}
              />
              <Bar dataKey="sessionsPerPlayer" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {visibleData.map((_, i) => (
                  <Cell key={`sf-${startIndex + i}`} fill={colorAt(startIndex + i)} fillOpacity={0.88} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SeriesZoomFrame>
  )
}
