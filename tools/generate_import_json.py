import os
import json
import time

def create_import_json():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    base_transcripts = os.path.join(project_root, 'transcripts')
    output_json = os.path.join(project_root, 'nativecamp_library.json')
    
    categories = ['beginner', 'intermediate']
    articles = []
    
    for category in categories:
        cat_dir = os.path.join(base_transcripts, category)
        if not os.path.exists(cat_dir):
            continue
            
        files = [f for f in os.listdir(cat_dir) if f.endswith(".txt")]
        # Numeric sort
        files.sort(key=lambda x: int(x.split('_')[1].split('.')[0]) if x.split('_')[1].split('.')[0].isdigit() else 999)
        
        for filename in files:
            lesson_num = filename.split('_')[1].split('.')[0]
            filepath = os.path.join(cat_dir, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            if content:
                # Add category to title or a new field if app supports it
                # For now, put in title
                cat_display = "Beginner" if category == "beginner" else "Intermediate"
                
                # Unique ID: use varied base ts to avoid clash
                ts = int(time.time() * 1000)
                # Offset beginner by 10000 to avoid clash if generating same time
                offset = 10000 if category == "beginner" else 20000
                
                articles.append({
                    "id": ts + int(lesson_num) + offset,
                    "title": f"[{cat_display}] Lesson {lesson_num}",
                    "category": category,
                    "content": content,
                    "date": time.strftime("%Y/%m/%d")
                })
            
    backup_data = {
        "articles": articles,
        "stats": {}
    }
    
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    
    print(f"Created {output_json} with {len(articles)} lessons.")

if __name__ == "__main__":
    create_import_json()
