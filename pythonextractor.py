import os
import time
import pandas as pd
import requests
from datetime import datetime 
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. Load the vault
load_dotenv()
DB_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("SUPABASE_URL")
if not DB_URL:
    raise ValueError("No database URL found. Set SUPABASE_DB_URL in .env.")

engine = create_engine(DB_URL)

def extract_metric(api_data, metric_name, key='value'):
    """Safe extraction: handles flat numbers, dicts, or lists smoothly."""
    data_block = api_data.get(metric_name)
    
    if not data_block:
        return 0
        
    if isinstance(data_block, (int, float, str)):
        return float(data_block) if str(data_block).replace('.', '', 1).isdigit() else 0
        
    if isinstance(data_block, dict):
        val = data_block.get(key)
        return float(val) if val is not None else 0
        
    if isinstance(data_block, list):
        for point in reversed(data_block):
            if isinstance(point, dict) and point.get(key) is not None:
                return float(point.get(key))
    return 0

def run_core_pipeline():
    print("🚀 Starting Core Data Pipeline...")
    
    # Grab your original curated maps directly from the database
    try:
        maps_df = pd.read_sql("SELECT island_code, map_name, genre FROM map_info", engine)
    except Exception as e:
        print(f"🚨 Could not read map_info table. Error: {e}")
        return

    if maps_df.empty:
        print("🚨 No maps found in your database! You might need to push your original list again.")
        return

    print(f"✅ Found {len(maps_df)} core maps. Fetching live stats...")
    
    for _, row in maps_df.iterrows():
        code = row['island_code']
        map_name = row['map_name']
        
        # Hit the API for this specific map
        api_url = f"https://api.fortnite.com/ecosystem/v1/islands/{code}/metrics?interval=day"
        
        try:
            time.sleep(0.3) # Keep the small pause so Epic doesn't block your IP
            response = requests.get(api_url, timeout=10)
            
            if response.status_code == 200:
                raw_json = response.json()
                data = raw_json.get("data", raw_json)
                
                stats = {
                    "island_code": code,
                    "captured_at": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                    "avg_playtime_mins": extract_metric(data, "averageMinutesPerPlayer"),
                    "players_peak": extract_metric(data, "peakCCU"),
                    "favorites": extract_metric(data, "favorites"),
                    "total_playtime_mins": extract_metric(data, "minutesPlayed"),
                    "retention_d1": extract_metric(data, "retention", "d1"),
                    "retention_d7": extract_metric(data, "retention", "d7"),
                    "total_unique_plays": extract_metric(data, "plays"),
                    "total_unique_players": extract_metric(data, "uniquePlayers"),
                }
                
                # Push directly to map_stats
                pd.DataFrame([stats]).to_sql('map_stats', engine, if_exists='append', index=False)
                
                # Using cp1252 encode/decode to prevent emojis in map names from crashing the terminal
                safe_name = str(map_name).encode("cp1252", errors="replace").decode("cp1252")
                print(f"[OK] Logged: {safe_name} | CCU: {stats['players_peak']}")
                
            else:
                print(f"[FAIL] {code} - Status {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] {code}: {e}")
            
    print("🎉 Core pipeline finished!")

if __name__ == "__main__":
    run_core_pipeline()