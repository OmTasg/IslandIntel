import { isSupabaseConfigured } from './supabase.js'

const apiFlag = import.meta.env.VITE_DATABASE_API

/**
 * Load from `/api/map-stats` (Node + DATABASE_URL). In dev, this defaults on unless you set
 * VITE_DATABASE_API=false — so `npm run dev` uses the warehouse with only DATABASE_URL in `.env`.
 */
export const isDatabaseApiEnabled =
  apiFlag === 'true' ||
  apiFlag === '1' ||
  (import.meta.env.DEV && apiFlag !== 'false' && apiFlag !== '0')

export function shouldLoadFromRemote() {
  return isDatabaseApiEnabled || isSupabaseConfigured
}
