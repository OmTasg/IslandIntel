/** Distinct neon-friendly colors for stacked areas, bars, and treemap cells */
export const CHART_ACCENT_SEQUENCE = [
  '#22d3ee',
  '#a78bfa',
  '#34d399',
  '#fb7185',
  '#fbbf24',
  '#38bdf8',
  '#c084fc',
  '#4ade80',
  '#f472b6',
  '#fcd34d',
]

export function colorAt(index) {
  return CHART_ACCENT_SEQUENCE[index % CHART_ACCENT_SEQUENCE.length]
}
