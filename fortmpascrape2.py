import cloudscraper
from bs4 import BeautifulSoup
import csv
import re
import time

TAGS = {
    "10": "1v1",
    "14": "boxfights",
    "4": "zonewars",
    "23": "tycoon",
    "27": "deathrun",
    "22": "open-world",
    "54": "prop-hunt",
    "47": "gun-game",
    "73": "edit-course"
}

BASE_URL = "https://fortnite.gg/creative?type=uefn&tag="

def scrape_fortnite_gg():
    print("WAKING UP THE SMART FORTNITE.GG SCRAPER...\n")
    
    scraper = cloudscraper.create_scraper(browser={
        'browser': 'chrome',
        'platform': 'windows',
        'desktop': True
    })
    
    results = []
    seen_codes = set()

    for tag_id, genre in TAGS.items():
        print(f"Checking category: {genre} (Tag: {tag_id})...")
        url = f"{BASE_URL}{tag_id}"
        
        try:
            response = scraper.get(url, timeout=15)
            
            if response.status_code != 200:
                print(f"  -> Blocked or failed (Status: {response.status_code})")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            all_links = soup.find_all('a')
            count = 0
            
            for link in all_links:
                href = link.get('href', '')
                code_match = re.search(r'(\d{4}-\d{4}-\d{4})', href)
                
                if code_match:
                    code = code_match.group(1)
                    
                    if code not in seen_codes:
                        name = "Unknown Name"
                        
                        # PRIORITY 1: The image's alt text (Usually the cleanest name)
                        img_tag = link.find('img')
                        heading_tag = link.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                        
                        if img_tag and img_tag.get('alt'):
                            name = img_tag.get('alt')
                        # PRIORITY 2: Look for a specific heading tag inside the card
                        elif heading_tag:
                            name = heading_tag.text.strip()
                        # PRIORITY 3: The title attribute
                        elif link.get('title'):
                            name = link.get('title')
                            
                        # Clean up the name
                        name = name.replace(code, "").strip()
                        name = re.sub(r'\s+', ' ', name) # Removes weird line breaks
                        
                        seen_codes.add(code)
                        results.append({
                            'island_code': code,
                            'map_name': name,
                            'genre': genre
                        })
                        
                        count += 1
                        if count >= 16:
                            break
                            
            print(f"  -> Successfully grabbed {count} maps and names for '{genre}'.")
            
        except Exception as e:
            print(f"  -> Error checking {genre}: {e}")
            
        time.sleep(2) 

    with open('fortnite_gg_data.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['island_code', 'map_name', 'genre'])
        writer.writeheader()
        writer.writerows(results)
        
    print(f"\nSUCCESS: Saved {len(results)} maps to fortnite_gg_data.csv.")

if __name__ == "__main__":
    scrape_fortnite_gg()