import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'islandintel:user-settings:v1'

const DEFAULT_SETTINGS = {
  showChartHints: true,
  mapsRowsPerPage: 100,
}

function sanitize(raw) {
  const next = { ...DEFAULT_SETTINGS, ...(raw || {}) }
  next.showChartHints = Boolean(next.showChartHints)
  const n = Number(next.mapsRowsPerPage)
  next.mapsRowsPerPage = Number.isFinite(n) ? Math.min(500, Math.max(25, Math.round(n))) : DEFAULT_SETTINGS.mapsRowsPerPage
  return next
}

export function useUserSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return DEFAULT_SETTINGS
      return sanitize(JSON.parse(raw))
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage write errors
    }
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => sanitize({ ...prev, ...patch }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
    defaults: DEFAULT_SETTINGS,
  }
}

