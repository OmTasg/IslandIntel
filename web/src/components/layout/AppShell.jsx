import { Menu, RefreshCw } from 'lucide-react'
import { Sidebar } from './Sidebar.jsx'

export function AppShell({
  children,
  sidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  onRefresh,
  title,
  subtitle,
  errorBanner,
  currentRoute = 'command',
}) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={onSidebarClose} currentRoute={currentRoute} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-700/60 bg-slate-900/55 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/40 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
                onClick={onSidebarOpen}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh data
            </button>
          </div>
          {errorBanner ? (
            <div className="mx-auto mt-3 max-w-[1600px] rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/90">
              {errorBanner}
            </div>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
