import { Dashboard } from './pages/Dashboard.jsx'
import { MapsPage } from './pages/MapsPage.jsx'
import { useEffect, useState } from 'react'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { useUserSettings } from './hooks/useUserSettings.js'
import { AboutPage } from './pages/AboutPage.jsx'

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash || '#command')
  const { settings, updateSettings, resetSettings } = useUserSettings()

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#command')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (hash === '#maps') return <MapsPage settings={settings} />
  if (hash === '#settings') {
    return <SettingsPage settings={settings} updateSettings={updateSettings} resetSettings={resetSettings} />
  }
  if (hash === '#about') return <AboutPage />
  return <Dashboard settings={settings} />
}
