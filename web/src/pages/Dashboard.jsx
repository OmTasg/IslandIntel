import { cloneElement, isValidElement, useState } from 'react'
import { useMapStats } from '../hooks/useMapStats.js'
import { AppShell } from '../components/layout/AppShell.jsx'
import { ChartCard } from '../components/ui/ChartCard.jsx'
import { ChartErrorBoundary } from '../components/ui/ErrorBoundary.jsx'
import { SkeletonChart } from '../components/ui/SkeletonChart.jsx'
import { DailyPlayerPulseChart } from '../components/charts/DailyPlayerPulseChart.jsx'
import { MarketShareMomentumChart } from '../components/charts/MarketShareMomentumChart.jsx'
import { EngagementMatrixChart } from '../components/charts/EngagementMatrixChart.jsx'
import { ViabilityMatrixChart } from '../components/charts/ViabilityMatrixChart.jsx'
import { GenreViabilityChart } from '../components/charts/GenreViabilityChart.jsx'
import { SessionFrequencyChart } from '../components/charts/SessionFrequencyChart.jsx'
import { MarketShareTreemapChart } from '../components/charts/MarketShareTreemapChart.jsx'

function ChartBody({ loading, children, height = 320, enableZoom = true, zoomMode = 'series', showHint = true }) {
  if (loading) {
    return <SkeletonChart />
  }

  if (!enableZoom) {
    return (
      <ChartErrorBoundary>
        <div className="w-full" style={{ height }}>
          {children}
        </div>
      </ChartErrorBoundary>
    )
  }

  const hint =
    zoomMode === 'scatter'
      ? 'Scroll to zoom into the axes (separates overlapping points) · drag to pan · double-click or Reset for full view'
      : 'Scroll to zoom the visible data range (not pixel scaling) · drag to pan · double-click or Reset for full range'

  const chartChild =
    (zoomMode === 'scatter' || zoomMode === 'series') && isValidElement(children)
      ? cloneElement(children, { height })
      : children

  return (
    <ChartErrorBoundary>
      <div className="w-full space-y-1">
        {showHint ? <p className="text-[10px] text-slate-500">{hint}</p> : null}
        {chartChild}
      </div>
    </ChartErrorBoundary>
  )
}

export function Dashboard({ settings }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    loading,
    error,
    refetch,
    pulseSeries,
    momentumStacked,
    momentumGenres,
    engagementScatter,
    viabilityLogScatter,
    genreViabilityScatter,
    genreCategoryLabels,
    sessionFrequencyBars,
    marketShareTreemap,
  } = useMapStats()

  const errorBanner = error
    ? `Warehouse request failed (${error}). Charts may be empty until the connection succeeds.`
    : null

  return (
    <AppShell
      title="Island command"
      subtitle="Live Creative intelligence — peaks, retention, and genre share"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      onRefresh={() => refetch()}
      errorBanner={errorBanner}
      currentRoute="command"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          className="xl:col-span-2"
          title="Daily player pulse"
          subtitle="Ecosystem peak players by capture hour (sum across active maps in window)"
        >
          <ChartBody loading={loading} height={340} zoomMode="series" showHint={settings?.showChartHints !== false}>
            <DailyPlayerPulseChart data={pulseSeries} />
          </ChartBody>
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          chartClassName="min-h-[420px] flex-1 p-4 pb-2"
          title="Market share momentum: intraday genre dominance"
          subtitle="Cumulative peak players by genre across each capture hour in your dataset"
          description="A stacked area chart tracking the sum of peak concurrent players across map genres for each hourly bucket. The top edge of the stack is total ecosystem peak for that hour; each band is that genre’s share of that total."
          whyItMatters="It works like a temporal heatmap for genre competition. Instead of only seeing daily totals, you can see which hours certain genres capture the largest slice of the active audience—useful for timing updates or pushes when your category historically peaks."
        >
          <ChartBody loading={loading} height={400} zoomMode="series" showHint={settings?.showChartHints !== false}>
            <MarketShareMomentumChart data={momentumStacked} genres={momentumGenres} />
          </ChartBody>
        </ChartCard>

        <ChartCard
          title="Engagement matrix"
          subtitle="Avg session length vs D1 retention; bubble area ∝ D7 retention"
          description="A multi-dimensional scatter plot tracking Day 1 Retention against Average Playtime Minutes. Bubble size acts as a third dimension, indicating Day 7 Retention to show long-term survival rates."
          whyItMatters="It isolates the &quot;stickiness&quot; of a map's gameplay loop. By plotting how long players stay in a single session against how likely they are to return the next day, developers can immediately spot which maps have strong initial hooks versus those that suffer from rapid player churn."
        >
          <ChartBody loading={loading} height={300} zoomMode="scatter" showHint={settings?.showChartHints !== false}>
            <EngagementMatrixChart data={engagementScatter} genreLabels={genreCategoryLabels} />
          </ChartBody>
        </ChartCard>

        <ChartCard
          title="Viability matrix"
          subtitle="Playtime vs peak players (log Y); size & hue from D1 retention"
          description="A scatter plot mapped on logarithmic X and Y axes, comparing Average Playtime against Peak Players. Bubble size and color gradients map directly to retention strength."
          whyItMatters="Logarithmic scales are perfect for visualizing datasets with massive outliers. This chart clearly separates the &quot;Elite&quot; maps (top right quadrant: high concurrency, high playtime, massive green bubbles for retention) from the rest of the market, providing a clear visual benchmark for a map's overall health and longevity."
        >
          <ChartBody loading={loading} height={300} zoomMode="scatter" showHint={settings?.showChartHints !== false}>
            <ViabilityMatrixChart data={viabilityLogScatter} genreLabels={genreCategoryLabels} />
          </ChartBody>
        </ChartCard>

        <ChartCard
          title="Genre viability"
          subtitle="Per-map peak distribution across genres (categorical X, log-scaled peaks)"
          description="A box-and-whisker plot utilizing a logarithmic scale to display the distribution of peak concurrent players across specific map categories. It overlays individual map data points to highlight upper-bound anomalies."
          whyItMatters="It reveals the true risk-to-reward ratio of building in a specific genre. It demonstrates that while genres like &quot;Tycoon&quot; have massive, 100k+ player outliers, the median performance of &quot;1v1&quot; or &quot;Boxfights&quot; might offer a more consistent, tighter grouping for developers seeking a safer baseline."
        >
          <ChartBody loading={loading} height={300} zoomMode="scatter" showHint={settings?.showChartHints !== false}>
            <GenreViabilityChart
              data={genreViabilityScatter}
              genreLabels={genreCategoryLabels}
            />
          </ChartBody>
        </ChartCard>

        <ChartCard
          title="Session frequency"
          subtitle="Mean plays per unique player (total_unique_plays ÷ total_unique_players) by genre"
          description="A ranked bar chart measuring the average number of discrete sessions per player across different map genres."
          whyItMatters="It measures addictive gameplay independently of sheer audience size. A high sessions-per-player metric (like the 1.7+ seen in Open-World and Tycoon maps) indicates a progression-heavy or highly replayable loop, guiding developers on which mechanics drive frequent return visits."
        >
          <ChartBody loading={loading} height={320} zoomMode="series" showHint={settings?.showChartHints !== false}>
            <SessionFrequencyChart data={sessionFrequencyBars} />
          </ChartBody>
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Market share distribution"
          subtitle="Treemap of summed total playtime minutes in the latest capture hour, by genre"
          description="A hierarchical visual utilizing proportional area to represent the sum of total playtime minutes captured by each genre within the ecosystem."
          whyItMatters="It provides an instant, high-level executive summary of market dominance. It clearly visualizes the massive footprint of &quot;Tycoon&quot; and &quot;1v1&quot; maps, allowing analysts to quickly gauge whether an emerging genre is actually capturing significant overall market share or just operating in a small niche."
        >
          <ChartBody loading={loading} height={340} enableZoom={false}>
            <MarketShareTreemapChart data={marketShareTreemap} />
          </ChartBody>
        </ChartCard>
      </div>
    </AppShell>
  )
}
