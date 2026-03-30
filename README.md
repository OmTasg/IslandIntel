# IslandIntel (Fortnite Creative Analytics)

IslandIntel is a full-stack analytics + BI dashboard for Fortnite Creative (UEFN). It combines:

- A **data ingestion pipeline** (Python) that pulls per-map metrics and appends them into Supabase/Postgres tables.
- A lightweight **Node/Express API** that serves the latest metrics to the frontend.
- A **React/Recharts dashboard** that visualizes retention, engagement, and market share—plus a dedicated **Maps** page to inspect all tracked islands.

## Origin (Tableau -> Web)

The plots in this project were first modeled in Tableau, and then (with help from Cursor) translated into a full website implementation using React, Recharts, and an API-backed data flow.

- Tableau Public reference dashboard: [IslandIntel on Tableau Public](https://public.tableau.com/views/IslandIntel_tableau/Dashboard8?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link)

## What you get

- **Command dashboard** (charts): Engagement + Viability scatter plots, Genre viability, Session frequency, and Market share treemap.
- **Maps page**: searchable list/table of all maps (name, code, genre, peak players, D1/D7 retention, avg playtime).
- **Zoom/pan** interaction on the scatter visualizations (Tableau-style axis zoom).
- **Hover tooltips** showing map identity (map name + code) and key metrics.

## Architecture

1. **Python ingestion**
   - Uses `pythonextractor.py` to:
     - Read map metadata from `map_info`.
     - Fetch live metrics from Epic’s ecosystem metrics endpoint for each `island_code`.
     - Append results into `map_stats`.
2. **Node API**
   - `web/server/mapStatsServer.mjs` exposes `GET /api/map-stats`
   - It performs a SQL join between `map_stats` and `map_info` to provide the frontend with `map_name` + `genre` alongside the numeric metrics.
3. **Frontend**
   - `web/` (Vite + React) renders:
     - `#command` → `Dashboard.jsx`
     - `#maps` → `MapsPage.jsx`
     - `#settings` → `SettingsPage.jsx`
     - `#about` → `AboutPage.jsx`

## Data pipeline (ETL + analytics semantics)

IslandIntel follows a practical ETL pattern tuned for product analytics:

### Extract

- **Source systems**
  - Epic ecosystem metrics endpoint (map-level telemetry)
  - Curated island metadata (`map_info`) seeded from discovery/scrape workflows (e.g. `fortmpascrape2.py`)
- **Entity key**
  - `island_code` is the canonical join key across metadata and metrics.

### Transform

- **Schema harmonization**
  - Raw API payloads are normalized into typed numeric fields:
    - engagement: `avg_playtime_mins`, `total_playtime_mins`
    - concurrency: `players_peak`
    - retention: `retention_d1`, `retention_d7`
    - demand/activity: `favorites`, `total_unique_plays`, `total_unique_players`
- **Data quality handling**
  - Defensive extraction logic converts nested/missing payload patterns into stable numeric outputs.
  - Null/invalid values are coerced to safe defaults where appropriate for downstream charting.
- **Feature engineering (dashboard model layer)**
  - `sessions_per_player` proxy from `total_unique_plays / total_unique_players`
  - deterministic jitter for categorical scatter separation
  - latest-observation rollups per map for point-in-time comparisons
  - genre-level aggregations and market-share composition.

### Load

- **Storage target**
  - `map_stats` (append-only snapshots; temporal fact table at map-time grain)
  - `map_info` (slow-changing map dimension attributes: `map_name`, `genre`)
- **Serving layer**
  - Node API (`/api/map-stats`) performs a relational join and returns analysis-ready records to the frontend.

### Analytical framing

- **Observation grain**
  - Core fact grain is `(island_code, captured_at)` with map-level metrics.
- **Time handling**
  - Dashboards use bucketed temporal aggregations for trend views and latest-snapshot views for cross-sectional comparisons.
- **Distribution-aware visualization**
  - Log scaling is used where heavy-tail effects/outliers dominate (`players_peak` distributions).
- **Retention interpretation**
  - D1 and D7 are treated as short- and mid-term stickiness signals; combined with playtime and concurrency to infer map health.

In short: this is not just chart rendering; it is a compact analytics stack with ETL, dimensional joins, engineered features, and BI-style exploratory views.

## Required database tables

This project expects (at minimum) two tables in Postgres/Supabase:

### `map_info`
Stores the curated universe of islands you want to analyze.

- `island_code` (text) — unique identifier (e.g. `1234-5678-9012`)
- `map_name` (text)
- `genre` (text)

### `map_stats`
Stores time-series metric snapshots per island.

- `island_code` (text)
- `captured_at` (timestamp/date)
- `avg_playtime_mins` (numeric)
- `players_peak` (numeric)
- `favorites` (numeric)
- `total_playtime_mins` (numeric)
- `retention_d1` (numeric, 0..1)
- `retention_d7` (numeric, 0..1)
- `total_unique_plays` (numeric)
- `total_unique_players` (numeric)

The API (`/api/map-stats`) currently fetches the latest rows ordered by `captured_at` and uses a join on `island_code` to attach `map_name` + `genre`.

## Environment variables

### Python ingestion (`./.env`)

`pythonextractor.py` loads `./.env` and uses:

- `SUPABASE_DB_URL` **or** `SUPABASE_URL`
  - PostgreSQL connection string used by SQLAlchemy.

Example (no real secrets in this README):

```env
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

### Node API + React frontend (`./web/.env`)

`web/server/mapStatsServer.mjs` loads `web/.env` and reads:

- `DATABASE_URL` (required)
- `MAP_STATS_API_PORT` (optional, default: `3456`)
- `MAP_STATS_ROW_LIMIT` (optional, default: `8000`)
- `MAP_STATS_TABLE` (optional, default: `map_stats`)
- `MAP_INFO_TABLE` (optional, default: `map_info`)
- `DATABASE_SSL` (optional; if not `false`, SSL is enabled for known hosts)

The frontend also uses:

- `VITE_DATABASE_API=true|false`
  - When `true`, the dashboard uses the Node API (`/api/map-stats`).

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
VITE_DATABASE_API=true
MAP_STATS_API_PORT=3456
MAP_STATS_ROW_LIMIT=8000
```

## Local setup

### 1) (Optional) Ingest/refresh metrics (Python)

```bash
pip install -r requirements.txt
python pythonextractor.py
```

This appends new snapshots into `map_stats`.

### 2) Run the dashboard (Node + React)

```bash
cd web
npm install
npm run dev
```

- The Node API is served from `web/server/mapStatsServer.mjs`
- Vite renders the UI and the charts call `/api/map-stats`

### 3) Useful scripts in this repo

- `fortmpascrape2.py`
  - Scrapes `fortnite.gg` to produce a CSV (`fortnite_gg_data.csv`) mapping:
    - `island_code` → `map_name` + `genre`
  - Use this as a starting point to populate `map_info`.

## Notes / troubleshooting

- If the frontend shows empty charts, verify:
  - `web/.env` has `DATABASE_URL`
  - `map_info` and `map_stats` exist with matching `island_code` values
  - `captured_at` has recent data (API pulls the latest)
- The treemap and scatter charts rely on the API join to provide `map_name` and `genre` for tooltips.
