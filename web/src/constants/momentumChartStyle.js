/**
 * Tableau reference: stacked areas bottom → top. Keys are normalized (lowercase, spaces → hyphens).
 */
export const MOMENTUM_STACK_ORDER = [
  'zonewars',
  'tycoon',
  'prop-hunt',
  'open-world',
  'gun-game',
  'edit-course',
  'deathrun',
  'boxfights',
  '1v1',
]

/** Fill colors from Tableau spec; unknown genres fall back via hash. */
export const MOMENTUM_GENRE_FILLS = {
  zonewars: '#A69185',
  'zone-wars': '#A69185',
  tycoon: '#F7B6C2',
  'prop-hunt': '#C9A0DC',
  prophunt: '#C9A0DC',
  'open-world': '#F9E79F',
  openworld: '#F9E79F',
  'gun-game': '#829356',
  gungame: '#829356',
  'edit-course': '#A2D9CE',
  editcourse: '#A2D9CE',
  deathrun: '#E07A5F',
  boxfights: '#F4A261',
  '1v1': '#5D8AA8',
  unknown: '#64748b',
}

const FALLBACK_SEQUENCE = [
  '#94a3b8',
  '#78716c',
  '#a8a29e',
  '#57534e',
  '#71717a',
]

export function normalizeGenreKey(genre) {
  if (genre == null || genre === '') return 'unknown'
  return String(genre)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
}

export function momentumGenreFill(genre) {
  const key = normalizeGenreKey(genre)
  if (MOMENTUM_GENRE_FILLS[key] != null) return MOMENTUM_GENRE_FILLS[key]
  let h = 0
  for (let i = 0; i < key.length; i += 1) {
    h = (h << 5) - h + key.charCodeAt(i)
  }
  return FALLBACK_SEQUENCE[Math.abs(h) % FALLBACK_SEQUENCE.length]
}

/** Darken hex for area stroke (Tableau-style edge definition). */
export function momentumGenreStroke(fillHex) {
  const hex = fillHex.replace('#', '')
  if (hex.length !== 6) return fillHex
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) * 0.72)
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) * 0.72)
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) * 0.72)
  const to = (n) => Math.round(n).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

const orderIndex = new Map(MOMENTUM_STACK_ORDER.map((k, i) => [k, i]))

/**
 * Stack order for Recharts: first series = bottom layer. Tableau list is already bottom → top.
 */
export function sortGenresForMomentumStack(genres) {
  const uniq = [...new Set(genres)]
  return uniq.sort((a, b) => {
    const ka = normalizeGenreKey(a)
    const kb = normalizeGenreKey(b)
    const ia = orderIndex.has(ka) ? orderIndex.get(ka) : 1000
    const ib = orderIndex.has(kb) ? orderIndex.get(kb) : 1000
    if (ia !== ib) return ia - ib
    return String(a).localeCompare(String(b))
  })
}
