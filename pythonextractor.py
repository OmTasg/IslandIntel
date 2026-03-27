import os
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# 1. Load secret variables from .env
load_dotenv()

# 2. Securely fetch database URL (support both names)
DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("SUPABASE_URL")
if not DB_URL:
    raise ValueError("No database URL found. Set SUPABASE_DB_URL in .env.")

engine = create_engine(DB_URL)

# 3. Load hit list from this script's folder
CSV_PATH = Path(__file__).resolve().parent / "fortnite_sample_data.csv"
islands_df = pd.read_csv(CSV_PATH)

def extract_metric(api_data, metric_name, key='value'):
    metric_list = api_data.get(metric_name, [])
    if metric_list and len(metric_list) > 0:
        return metric_list[0].get(key, 0)
    return 0


def safe_console(text_value):
    """Return text that can always print on cp1252 terminals."""
    return str(text_value).encode("cp1252", errors="replace").decode("cp1252")

def fetch_and_store():
    for _, row in islands_df.iterrows():
        code = row["island_code"]
        map_name = row.get("map_name", "")
        genre = row.get("genre", "")
        
        # API endpoint for public metrics
        api_url = f"https://api.fortnite.com/ecosystem/v1/islands/{code}/metrics"
        
        try:
            response = requests.get(api_url, timeout=20)
            if response.status_code == 200:
                # Check if the data is wrapped in a 'data' key, otherwise use the root JSON
                raw_json = response.json()
                data = raw_json.get('data', raw_json)
                
                # Format the data using the helper function
                stats = {
                    "island_code": code,
                    "avg_playtime_mins": extract_metric(data, 'averageMinutesPerPlayer'),
                    "players_peak": extract_metric(data, 'peakCCU'),
                    "favorites": extract_metric(data, 'favorites'),
                    "total_playtime_mins": extract_metric(data, 'minutesPlayed'),
                    "retention_d1": extract_metric(data, 'retention', 'd1'),
                    "retention_d7": extract_metric(data, 'retention', 'd7'),
                    "total_unique_plays": extract_metric(data, 'plays'),
                    "total_unique_players": extract_metric(data, 'uniquePlayers'),
                }
                
                # Ensure parent record exists first (foreign key map_stats.island_code -> map_info.island_code)
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO map_info (island_code, map_name, genre)
                            VALUES (:island_code, :map_name, :genre)
                            ON CONFLICT (island_code)
                            DO UPDATE SET map_name = EXCLUDED.map_name, genre = EXCLUDED.genre
                            """
                        ),
                        {"island_code": code, "map_name": map_name, "genre": genre},
                    )

                # Push stats
                pd.DataFrame([stats]).to_sql('map_stats', engine, if_exists='append', index=False)
                
                print(f"[OK] Logged stats for {safe_console(map_name or code)}")
            else:
                print(f"[FAIL] {code}: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] {code}: {e}")

# Run it!
fetch_and_store()