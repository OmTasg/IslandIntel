# IslandIntel (Fortnite Creative Analytics)

IslandIntel is a full-stack analytics platform tracking the Fortnite Creative (UEFN) ecosystem. It features an automated data ingestion pipeline, a cloud-hosted PostgreSQL database, and a custom React front-end to visualize market share, map viability, and player retention.

## The Data Lifecycle

This project was built in two distinct phases to mirror professional BI workflows:

1. **Exploratory Data Analysis (Tableau):** Before writing the front-end code, I connected the raw database to Tableau Desktop to test logarithmic scales, model the plots, and identify the highest-signal visualizations. [View the Tableau Prototype Here](https://public.tableau.com/views/IslandIntel_tableau/Dashboard8?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link).
2. **Full-Stack Application (React + Recharts):** Because standard BI tools struggle with zero-latency web connections, I used Cursor to translate the Tableau wireframes into a custom React application, computing statistical metrics client-side and rendering SVG charts natively with Recharts.

## Architecture & Automation

This project relies on a modern, fully automated ETL pipeline:

* **Automated Ingestion (GitHub Actions):** A Python script (`pythonextractor.py`) is scheduled via GitHub Actions cron jobs to run automatically. It fetches live, map-level telemetry from Epic Games' ecosystem metrics endpoint.
* **Cloud Database (Supabase / PostgreSQL):** The extracted data is cleaned, typed, and pushed to a cloud-hosted PostgreSQL data warehouse managed by Supabase. This allows for reliable, scalable time-series storage.
* **Serving Layer (Node/Express):** A lightweight API (`/api/map-stats`) performs relational SQL joins between the `map_stats` and `map_info` tables, serving clean, formatted JSON arrays directly to the React front-end.

## Features

- **The Command Center:** Interactive scatter plots (Log-scale Viability & Engagement), categorized Box-and-Whisker genre viability, and a Market Share treemap.
- **Interactive Recharts:** Full support for highlight-to-zoom, panning, and custom data tooltips.
- **Map Directory:** A searchable data table indexing all tracked maps by peak concurrency, average playtime, and Day 1 / Day 7 retention.

## Database Schema

This project expects two tables in your Supabase PostgreSQL instance:

**1. `map_info` (Dimension Table)**
Stores the curated universe of tracked islands.
* `island_code` (PK, text)
* `map_name` (text)
* `genre` (text)

**2. `map_stats` (Time-Series Fact Table)**
Stores the append-only metric snapshots.
* `island_code` (FK, text)
* `captured_at` (timestamp)
* `avg_playtime_mins`, `players_peak`, `favorites` (numeric)
* `retention_d1`, `retention_d7` (numeric, 0..1)
* `total_unique_plays`, `total_unique_players` (numeric)

## Local Setup

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
