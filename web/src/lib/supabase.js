import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isPostgresConnectionString =
  typeof url === 'string' && /^postgres(ql)?:\/\//i.test(url)

/**
 * Browser client uses the Supabase **HTTPS** project URL + anon key only.
 * A `postgresql://…` pooler string belongs in `DATABASE_URL` on the server (see `server/mapStatsServer.mjs`).
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !isPostgresConnectionString,
)

export const supabase =
  url && anonKey && !isPostgresConnectionString ? createClient(url, anonKey) : null
