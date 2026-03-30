import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell.jsx'

export function SettingsPage({ settings, updateSettings, resetSettings }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AppShell
      title="Settings"
      subtitle="Personalize dashboard behavior"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      onRefresh={() => window.location.reload()}
      currentRoute="settings"
    >
      <div className="grid grid-cols-1 gap-4 xl:max-w-3xl">
        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Dashboard</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">Show chart interaction hints</span>
              <input
                type="checkbox"
                checked={settings.showChartHints}
                onChange={(e) => updateSettings({ showChartHints: e.target.checked })}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Maps Page</h2>
          <div className="mt-4">
            <label className="block text-sm text-slate-300">Rows per page</label>
            <select
              value={settings.mapsRowsPerPage}
              onChange={(e) => updateSettings({ mapsRowsPerPage: Number(e.target.value) })}
              className="mt-2 w-44 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/50 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <button
            type="button"
            onClick={resetSettings}
            className="rounded-lg border border-slate-600/80 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800"
          >
            Reset to defaults
          </button>
        </section>
      </div>
    </AppShell>
  )
}

