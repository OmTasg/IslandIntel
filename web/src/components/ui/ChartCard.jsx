export function ChartCard({
  title,
  subtitle,
  description,
  whyItMatters,
  className = '',
  chartClassName = 'min-h-[300px] flex-1 p-4',
  children,
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/55 shadow-lg shadow-black/25 ring-1 ring-white/[0.03] backdrop-blur-sm ${className}`}
    >
      <header className="border-b border-slate-700/60 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </header>
      <div className={chartClassName}>{children}</div>
      {(description || whyItMatters) && (
        <footer className="border-t border-slate-700/50 bg-slate-950/30 px-5 py-4">
          {description ? (
            <p className="text-xs leading-relaxed text-slate-400">{description}</p>
          ) : null}
          {whyItMatters ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              <span className="font-medium text-slate-400">Why it matters: </span>
              {whyItMatters}
            </p>
          ) : null}
        </footer>
      )}
    </section>
  )
}
