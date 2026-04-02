import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import pg from 'pg'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { Pool } = pg
const PORT = Number(process.env.MAP_STATS_API_PORT || 3456)
const LIMIT = Math.min(Number(process.env.MAP_STATS_ROW_LIMIT || 8000), 50000)

function poolConfig() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  const useSsl =
    process.env.DATABASE_SSL !== 'false' &&
    /supabase\.com|neon\.tech|render\.com/i.test(connectionString)
  return {
    connectionString,
    max: 8,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  }
}

function sqlIdent(raw, fallback) {
  const s = (raw || fallback).trim()
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s) ? s : fallback
}

const statsTable = sqlIdent(process.env.MAP_STATS_TABLE, 'map_stats')
const infoTable = sqlIdent(process.env.MAP_INFO_TABLE, 'map_info')

const poolCfg = poolConfig()
const pool = poolCfg ? new Pool(poolCfg) : null

const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: Boolean(pool) })
})

app.get('/api/map-stats', async (_req, res) => {
  if (!pool) {
    res.status(503).json({
      error: 'DATABASE_URL is not set. Add it to web/.env (server-only, never VITE_*).',
    })
    return
  }

  const sql = `
    SELECT
      ms.island_code,
      ms.captured_at,
      ms.avg_playtime_mins,
      ms.players_peak,
      ms.favorites,
      ms.total_playtime_mins,
      ms.retention_d1,
      ms.retention_d7,
      ms.total_unique_plays,
      ms.total_unique_players,
      mi.island_code AS map_info_island_code,
      mi.map_name AS map_name,
      mi.genre AS map_genre
    FROM ${statsTable} ms
    LEFT JOIN ${infoTable} mi ON mi.island_code = ms.island_code
    ORDER BY ms.captured_at DESC
    LIMIT $1
  `

  try {
    const { rows } = await pool.query(sql, [LIMIT])
    const data = rows.map((row) => ({
      island_code: row.island_code,
      captured_at:
        row.captured_at instanceof Date
          ? row.captured_at.toISOString()
          : row.captured_at,
      avg_playtime_mins: row.avg_playtime_mins,
      players_peak: row.players_peak,
      favorites: row.favorites,
      total_playtime_mins: row.total_playtime_mins,
      retention_d1: row.retention_d1,
      retention_d7: row.retention_d7,
      total_unique_plays: row.total_unique_plays,
      total_unique_players: row.total_unique_players,
      map_info:
        row.map_info_island_code != null || row.map_name != null || row.map_genre != null
          ? { map_name: row.map_name, genre: row.map_genre, island_code: row.map_info_island_code }
          : null,
    }))
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err?.message ?? 'Query failed' })
  }
})

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.MAP_STATS_API_PORT || 3456;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;