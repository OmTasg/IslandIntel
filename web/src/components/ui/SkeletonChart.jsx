export function SkeletonChart() {
  return (
    <div
      className="flex h-full min-h-[260px] flex-col gap-3"
      aria-hidden
    >
      <div className="h-4 w-1/3 animate-pulse rounded-md bg-slate-800/90" />
      <div className="relative flex flex-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
        <div className="skeleton-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/25 to-transparent" />
        <div className="m-auto flex w-[88%] flex-col justify-end gap-2 pb-6">
          <div className="h-[45%] w-full animate-pulse rounded-md bg-slate-800/70" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-800/50" />
        </div>
      </div>
    </div>
  )
}
