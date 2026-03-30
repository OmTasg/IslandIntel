import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell.jsx'

export function AboutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AppShell
      title="About"
      subtitle="IslandIntel — built for the Fortnite Creative community"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      onRefresh={() => window.location.reload()}
      errorBanner={null}
      currentRoute="about"
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Built by Om Tasgaonkar</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            IslandIntel was made by Om Tasgaonkar, out of a deep love and passion for Fortnite.
            Like many creators and players, I didn’t just want to enjoy the experience — I wanted to understand it.
            The better we can see what works in Creative, the easier it is to build maps that people keep coming back to.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            That’s why I started putting this together: to turn raw map signals into something useful. Charts and
            insights help surface trends, highlight what players respond to, and make it simpler for creators to
            improve their next iteration. If this helps even a few people make stronger experiences, it’s worth it.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <h2 className="text-sm font-semibold text-slate-100">What this project is for</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc pl-5">
            <li>Help creators spot performance patterns faster.</li>
            <li>Make it easier to compare genres, loops, and retention.</li>
            <li>Give the community practical feedback to iterate on maps.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/55 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Stay in the loop</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            If you have ideas, feedback, or want to suggest a new visualization, I’m always listening. This is built
            to improve alongside the community that uses it.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

