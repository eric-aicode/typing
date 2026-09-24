import os
import re
import urllib.request
import time

def download_files():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    html_file = os.path.join(script_dir, 'nativecamp.html')
    output_dir = os.path.join(project_root, 'nativecamp_audio')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find all mp3 links
    links = re.findall(r"href='(https?://[^']+?\.mp3)'", content)
    
    total = len(links)
    print(f"Found {total} audio files to download.")
    
    for i, url in enumerate(links, 1):
        # Create subdirectories based on the URL structure (middle/1/, middle/2/, etc.)
        # Example URL: https://.../pronunciation/middle/1/1-7.mp3
        parts = url.split('/')
        lesson_num = parts[-2] # e.g., '1', '2'
        filename = parts[-1]   # e.g., '1-7.mp3'
        
        lesson_dir = os.path.join(output_dir, f"lesson_{lesson_num}")
        if not os.path.exists(lesson_dir):
            os.makedirs(lesson_dir)
            
        filepath = os.path.join(lesson_dir, filename)
        
        if os.path.exists(filepath):
            print(f"[{i}/{total}] Skipping {filename} (already exists)")
            continue
            
        print(f"[{i}/{total}] Downloading {filename} to lesson_{lesson_num}...")
        try:
            urllib.request.urlretrieve(url, filepath)
            # Gentle delay to be a good citizen
            time.sleep(0.5)
        except Exception as e:
            print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    download_files()
