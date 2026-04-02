import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { isDatabaseApiEnabled, shouldLoadFromRemote } from '../lib/dataSources.js'
import { MOCK_MAP_STATS_ROWS } from '../data/placeholderMapStats.js'
import { sortGenresForMomentumStack } from '../constants/momentumChartStyle.js'

function hourBucketTs(iso) {
  const d = parseISO(iso)
  d.setUTCMinutes(0, 0, 0)
  return d.getTime()
}

/** Stable key per island / map row */
function rowIslandKey(r) {
  return r.island_code ?? r.map_id ?? r.id
}

function mapLabel(r) {
  const info = r.map_info
  return (
    info?.map_name ??
    info?.name ??
    r.island_code ??
    r.map_id ??
    'Unknown'
  )
}

/** Island / map identifier for tooltips (Supabase: island_code, optional map_id). */
function mapCode(r) {
  // Prefer `map_info.island_code` (joined table) so hover matches the exact map row.
  if (r.map_info?.island_code != null && r.map_info.island_code !== '') return String(r.map_info.island_code)
  if (r.island_code != null && r.island_code !== '') return String(r.island_code)
  if (r.map_id != null && r.map_id !== '') return String(r.map_id)
  return ''
}

function mapGenre(r) {
  const g = r.map_info?.genre
  return g == null || g === '' ? 'Unknown' : g
}

/** Plays per unique player (replaces removed `sessions_per_player` when absent). */
function sessionsPerPlayer(r) {
  if (r.sessions_per_player != null && Number.isFinite(Number(r.sessions_per_player))) {
    return Number(r.sessions_per_player)
  }
  const plays = Number(r.total_unique_plays) || 0
  const players = Number(r.total_unique_players) || 0
  return players > 0 ? plays / players : 0
}

/** Stacked momentum = sum of players_peak by genre per hour (Tableau “Players Peak” stack). */
function momentumPlayersPeak(r) {
  return Number(r.players_peak) || 0
}

function latestRowPerIsland(rows) {
  const byIsland = new Map()
  for (const row of rows) {
    const key = rowIslandKey(row)
    const prev = byIsland.get(key)
    const t = parseISO(row.captured_at).getTime()
    if (!prev || t > parseISO(prev.captured_at).getTime()) {
      byIsland.set(key, row)
    }
  }
  return [...byIsland.values()]
}

function strJitter(key) {
  let h = 0
  for (let i = 0; i < key.length; i += 1) {
    h = (h << 5) - h + key.charCodeAt(i)
  }
  return (Math.abs(h) % 80) / 200
}

/**
 * Turn `map_stats` rows (+ optional `map_info` join) into Recharts payloads.
 */
export function rowsToChartModel(rows) {
  if (!rows?.length) {
    return {
      pulseSeries: [],
      momentumStacked: [],
      momentumGenres: [],
      engagementScatter: [],
      viabilityLogScatter: [],
      genreViabilityScatter: [],
      sessionFrequencyBars: [],
      marketShareTreemap: [],
      genreCategoryLabels: [],
      mapsList: [],
    }
  }

  const pulseMap = new Map()
  for (const r of rows) {
    const ts = hourBucketTs(r.captured_at)
    pulseMap.set(ts, (pulseMap.get(ts) ?? 0) + (Number(r.players_peak) || 0))
  }
  const pulseSeries = [...pulseMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, playersPeak]) => ({
      capturedAt: new Date(ts).toISOString(),
      labelHour: format(ts, 'HH:00'),
      playersPeak,
    }))

  const momentumBuckets = new Map()
  const genreSet = new Set()
  for (const r of rows) {
    const ts = hourBucketTs(r.captured_at)
    const genre = mapGenre(r)
    genreSet.add(genre)
    if (!momentumBuckets.has(ts)) momentumBuckets.set(ts, new Map())
    const gmap = momentumBuckets.get(ts)
    gmap.set(genre, (gmap.get(genre) ?? 0) + momentumPlayersPeak(r))
  }
  const momentumGenres = sortGenresForMomentumStack([...genreSet])
  const momentumStacked = [...momentumBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, gmap], hourOfWindow) => {
      const base = {
        capturedAt: new Date(ts).toISOString(),
        labelHour: format(ts, 'HH:00'),
        hourOfWindow,
      }
      for (const g of momentumGenres) {
        base[g] = gmap.get(g) ?? 0
      }
      return base
    })

  const latest = latestRowPerIsland(rows)
  const engagementScatter = latest.map((r) => ({
    mapName: mapLabel(r),
    mapCode: mapCode(r),
    genre: mapGenre(r),
    avgPlaytimeMins: Number(r.avg_playtime_mins) || 0,
    retentionD1: Number(r.retention_d1) || 0,
    retentionD7: Number(r.retention_d7) || 0,
  }))

  const viabilityLogScatter = latest
    .filter((r) => (Number(r.players_peak) || 0) > 0)
    .map((r) => ({
      mapName: mapLabel(r),
      mapCode: mapCode(r),
      genre: mapGenre(r),
      avgPlaytimeMins: Number(r.avg_playtime_mins) || 0,
      playersPeak: Number(r.players_peak) || 0,
      retentionD1: Number(r.retention_d1) || 0,
    }))

  const genresOrdered = [...new Set(latest.map((r) => mapGenre(r)))].sort()
  const genreIndex = Object.fromEntries(genresOrdered.map((g, i) => [g, i]))

  const genreViabilityScatter = latest.map((r) => {
    const g = mapGenre(r)
    const idx = genreIndex[g] ?? 0
    return {
      genre: g,
      genreIndex: idx + strJitter(`${rowIslandKey(r)}:${g}`),
      playersPeak: Number(r.players_peak) || 0,
      mapName: mapLabel(r),
      mapCode: mapCode(r),
      retentionD1: Number(r.retention_d1) || 0,
    }
  })

  const sessionsByGenre = new Map()
  const countsByGenre = new Map()
  for (const r of latest) {
    const g = mapGenre(r)
    sessionsByGenre.set(g, (sessionsByGenre.get(g) ?? 0) + sessionsPerPlayer(r))
    countsByGenre.set(g, (countsByGenre.get(g) ?? 0) + 1)
  }
  const sessionFrequencyBars = [...sessionsByGenre.entries()]
    .map(([genre, sum]) => ({
      genre,
      sessionsPerPlayer: sum / (countsByGenre.get(genre) || 1),
    }))
    .sort((a, b) => b.sessionsPerPlayer - a.sessionsPerPlayer)

  const maxTs = Math.max(...rows.map((r) => parseISO(r.captured_at).getTime()))
  const latestBucket = hourBucketTs(new Date(maxTs).toISOString())
  const inLatestHour = rows.filter((r) => hourBucketTs(r.captured_at) === latestBucket)
  const shareByGenre = new Map()
  for (const r of inLatestHour) {
    const g = mapGenre(r)
    shareByGenre.set(g, (shareByGenre.get(g) ?? 0) + (Number(r.total_playtime_mins) || 0))
  }
  const marketShareTreemap = [...shareByGenre.entries()].map(([name, size]) => ({
    name,
    size,
  }))

  const mapsList = latest
    .map((r) => ({
      mapName: mapLabel(r),
      mapCode: mapCode(r),
      genre: mapGenre(r),
      playersPeak: Number(r.players_peak) || 0,
      avgPlaytimeMins: Number(r.avg_playtime_mins) || 0,
      retentionD1: Number(r.retention_d1) || 0,
      retentionD7: Number(r.retention_d7) || 0,
    }))
    .sort((a, b) => b.playersPeak - a.playersPeak)

  return {
    pulseSeries,
    momentumStacked,
    momentumGenres,
    engagementScatter,
    viabilityLogScatter,
    genreViabilityScatter,
    sessionFrequencyBars,
    marketShareTreemap,
    genreCategoryLabels: genresOrdered,
    mapsList,
  }
}

const emptyModel = rowsToChartModel([])

async function fetchMapStatsFromApi() {
  const res = await fetch('/api/map-stats')
  const text = await res.text()
  if (!res.ok) {
    let msg = `API ${res.status}`
    try {
      const body = JSON.parse(text)
      if (body.error) msg = body.error
    } catch {
      if (text) msg = text
    }
    throw new Error(msg)
  }
  return text ? JSON.parse(text) : []
}

export function useMapStats() {
  const [loading, setLoading] = useState(shouldLoadFromRemote)
  const [error, setError] = useState(null)
  const [rawRows, setRawRows] = useState(null)

  const fetchData = useCallback(async () => {
    if (!shouldLoadFromRemote()) {
      setRawRows(MOCK_MAP_STATS_ROWS)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isDatabaseApiEnabled) {
        const data = await fetchMapStatsFromApi()
        setRawRows(Array.isArray(data) ? data : [])
        return
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error: qErr } = await supabase
          .from('map_stats')
          .select(
            `
            island_code,
            captured_at,
            avg_playtime_mins,
            players_peak,
            favorites,
            total_playtime_mins,
            retention_d1,
            retention_d7,
            total_unique_plays,
            total_unique_players,
            map_info (
              map_name,
              genre
            )
          `,
          )
          .order('captured_at', { ascending: false })
          .limit(8000)

        if (qErr) throw qErr
        setRawRows(data ?? [])
        return
      }

      setRawRows(MOCK_MAP_STATS_ROWS)
    } catch (e) {
      console.error(e)
      setError(e?.message ?? 'Failed to load map stats')
      setRawRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const model = useMemo(() => {
    if (!rawRows) return emptyModel
    return rowsToChartModel(rawRows)
  }, [rawRows])

  return {
    loading,
    error,
    refetch: fetchData,
    ...model,
  }
}

export const PLACEHOLDER_CHART_DATA = rowsToChartModel(MOCK_MAP_STATS_ROWS)
