import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell.jsx'
import { useMapStats } from '../hooks/useMapStats.js'

function cellNum(n) {
  return Number.isFinite(Number(n)) ? Number(n).toLocaleString() : '—'
}

export function MapsPage({ settings }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const {
    loading,
    error,
    refetch,
    mapsList,
  } = useMapStats()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mapsList
    return mapsList.filter((m) => {
      const name = m.mapName?.toLowerCase() ?? ''
      const code = m.mapCode?.toLowerCase() ?? ''
      const genre = m.genre?.toLowerCase() ?? ''
      return name.includes(q) || code.includes(q) || genre.includes(q)
    })
  }, [mapsList, query])
  const rowsPerPage = settings?.mapsRowsPerPage ?? 100
  const visibleRows = rows.slice(0, rowsPerPage)

  const errorBanner = error
    ? `Warehouse request failed (${error}). Maps list may be empty until the connection succeeds.`
    : null

  return (
    <AppShell
      title="Maps"
      subtitle="All tracked maps and top-level performance signals"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      onRefresh={() => refetch()}
      errorBanner={errorBanner}
      currentRoute="maps"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search maps by name, code, or genre"
              className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-200">{visibleRows.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{mapsList.length}</span> maps
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/55">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Map</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Genre</th>
                  <th className="px-4 py-3 text-right">Peak players</th>
                  <th className="px-4 py-3 text-right">Avg playtime</th>
                  <th className="px-4 py-3 text-right">D1</th>
                  <th className="px-4 py-3 text-right">D7</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      Loading maps...
                    </td>
                  </tr>
                ) : visibleRows.length ? (
                  visibleRows.map((m, i) => (
                    <tr key={`${m.mapCode || m.mapName}-${i}`} className="hover:bg-slate-800/35">
                      <td className="px-4 py-3 font-medium text-slate-100">{m.mapName || 'Unknown map'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.mapCode || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{m.genre || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right text-slate-200">{cellNum(m.playersPeak)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {Number.isFinite(Number(m.avgPlaytimeMins)) ? `${Number(m.avgPlaytimeMins).toFixed(1)} min` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {Number.isFinite(Number(m.retentionD1)) ? `${(Number(m.retentionD1) * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {Number.isFinite(Number(m.retentionD7)) ? `${(Number(m.retentionD7) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No maps found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {rows.length > rowsPerPage ? (
              <div className="border-t border-slate-800/80 px-4 py-2 text-xs text-slate-500">
                Limited to first {rowsPerPage} rows by Settings.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

