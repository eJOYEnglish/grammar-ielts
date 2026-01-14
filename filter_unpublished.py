import csv
import json
import requests
import os
import re

CSV_PATH = '/Users/diep/Documents/Test project/Diagnostic_Grammar_Test/doc/grammar/epic_lessons_full_report.csv'
JSON_PATH = '/Users/diep/Documents/Test project/Diagnostic_Grammar_Test/frontend/src/data/grammar_resources.json'
GRAPHQL_ENDPOINT = 'https://api.ejoy.io/graph?'

HEADERS = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'pass-key': 'ejoy2018', # Assuming key might be needed if public access is restricted? Or just try standard headers from curl
    'origin': 'https://api.ejoy.io',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
}

def load_csv_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def save_csv_data(filepath, fieldnames, data):
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def get_video_status(grammar_id):
    query = """
    query getVideoByGrammar($id:ID!, $options:OptionCateType,$first: Int, $after: String){
        byGrammarVideoEpic(id:$id, options:$options){
            videos(first: $first, after: $after){
                totalCount
                infos {
                    _id
                    statusPublished
                    title
                }
            }
        }
    }
    """
    
    # Increase limit to ensuring better coverage
    variables = {
        "id": grammar_id,
        "options": {"exclusiveFeature": False},
        "first": 300, 
        "after": ""
    }
    
    response = requests.post(
        GRAPHQL_ENDPOINT,
        headers=HEADERS,
        json={"query": query, "variables": variables, "operationName": "getVideoByGrammar"}
    )
    
    if response.status_code != 200:
        print(f"Error querying {grammar_id}: {response.status_code}")
        return {}
    
    data = response.json()
    try:
        if 'errors' in data:
            print(f"GraphQL Errors for {grammar_id}: {data['errors']}")
            return {}

        videos = data['data']['byGrammarVideoEpic']['videos']['infos']
        total_count = data['data']['byGrammarVideoEpic']['videos']['totalCount']
        
        # Debug: Check if we are missing videos due to pagination
        if len(videos) < total_count:
            print(f"[{grammar_id}] Warning: Fetched {len(videos)} of {total_count} videos. Pagination might be needed.")
            
        status_map = {}
        for video in videos:
            vid_id = video['_id']
            is_published = video['statusPublished']
            status_map[vid_id] = is_published
            if vid_id.startswith('ep_'):
                 status_map[vid_id[3:]] = is_published
            else:
                 status_map[f"ep_{vid_id}"] = is_published
        return status_map
    except (KeyError, TypeError) as e:
        print(f"Unexpected response format for {grammar_id}: {e}")
        return {}

def run():
    print("Loading CSV...")
    csv_rows = load_csv_data(CSV_PATH)
    
    grammar_ids = set()
    for row in csv_rows:
        gid = row.get('Grammar Topic ID')
        if gid:
            grammar_ids.add(gid)
            
    print(f"Found {len(grammar_ids)} unique grammar topics.")
    
    master_status_map = {} 
    
    # Debug: Pick a known unpublished ID if we know one, matching the logic
    # Or just query all as before
    for i, gid in enumerate(grammar_ids):
        # Optional: Print progress less frequently if needed, but for now 115 is fine
        if (i+1) % 10 == 0:
            print(f"[{i+1}/{len(grammar_ids)}] Querying...")
        statuses = get_video_status(gid)
        master_status_map.update(statuses)

    print(f"Total videos in master map: {len(master_status_map)}")
        
    print("Updating CSV rows...")
    updated_rows = []
    fieldnames = csv_rows[0].keys() if csv_rows else []
    
    changed_count = 0
    for row in csv_rows:
        vid_id = row['Lesson ID']
        if vid_id in master_status_map:
            is_published = master_status_map[vid_id]
            new_status = "Yes" if is_published else "No"
            
            if row.get('Status Published') != new_status:
                # Debug logging for change
                # print(f"Changing {vid_id} from {row.get('Status Published')} to {new_status}")
                row['Status Published'] = new_status
                changed_count += 1
                
        updated_rows.append(row)
        
    print(f"Updated status for {changed_count} rows in CSV.")
    save_csv_data(CSV_PATH, fieldnames, updated_rows)
    
    print("Filtering JSON...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
        
    keys_to_remove = []
    
    for key, item in json_data.items():
        url = item.get('videoUrl', '')
        if not url:
            continue
            
        match = re.search(r'/([^/]+)$', url)
        if match:
            vid_id = match.group(1)
            
            # Check master map
            if vid_id in master_status_map:
                if not master_status_map[vid_id]:
                    print(f"Removing {key} (Video {vid_id}) - Unpublished (Found in API)")
                    keys_to_remove.append(key)
            else:
                # Fallback: Maybe the ID in JSON is slightly different or not in the grammar topics queried?
                # Let's try to match by 'ep_' or without 'ep_' just in case regex match differs from map expectation
                # The map has both variants, so simply not being in map means we didn't fetch it.
                # If we didn't fetch it, we can't confirm it's unpublished, so we KEEP it.
                print(f"Warning: Video {vid_id} for {key} not found in API response map. Keeping.")

    for k in keys_to_remove:
        del json_data[k]
        
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
        
    print(f"Removed {len(keys_to_remove)} unpublished videos from JSON.")

if __name__ == "__main__":
    run()
