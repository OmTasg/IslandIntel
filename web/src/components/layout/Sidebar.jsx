import { BookOpen, LayoutDashboard, Map, Settings, X } from 'lucide-react'

const nav = [
  { label: 'Command', icon: LayoutDashboard, href: '#command', route: 'command' },
  { label: 'Maps', icon: Map, href: '#maps', route: 'maps' },
  { label: 'Settings', icon: Settings, href: '#settings', route: 'settings' },
  { label: 'About', icon: BookOpen, href: '#about', route: 'about' },
]

export function Sidebar({ open, onClose, currentRoute = 'command' }) {
  return (
    <>
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-700/80 bg-slate-950/95 shadow-2xl shadow-black/40 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 px-4 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-sm font-bold tracking-tight text-cyan-300 ring-1 ring-cyan-500/30">
              II
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100">IslandIntel</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Creative OS</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const { label, icon: NavIcon, href, route } = item
            const active = currentRoute === route
            return (
              <a
                key={label}
                href={href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/25'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200',
                ].join(' ')}
              >
                <NavIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {label}
              </a>
            )
          })}
        </nav>
        <div className="border-t border-slate-700/60 p-4 text-[11px] leading-relaxed text-slate-600">
          Fortnite Creative analytics — warehouse-connected, client-side metrics.
        </div>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu overlay"
          onClick={onClose}
        />
      ) : null}
    </>
  )
}
