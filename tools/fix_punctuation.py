import json
import re

def fix_content(content):
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Capitalize first letter
        line = line[0].upper() + line[1:]
        
        # Add period if no punctuation at end
        if not line.endswith(('.', '!', '?')):
            line += '.'
            
        # Common Fixes
        line = line.replace('james bond', 'James Bond')
        line = line.replace('specter', 'Specter')
        line = line.replace('chanel boutique', 'Chanel Boutique')
        line = line.replace('paris', 'Paris')
        line = line.replace('london', 'London')
        line = line.replace('native camp', 'Native Camp')
        line = line.replace('mumbai', 'Mumbai')
        line = line.replace('machu picchu', 'Machu Picchu')
        line = line.replace('singapore', 'Singapore')
        line = line.replace('malaysia', 'Malaysia')
        line = line.replace('karaage kun', 'Karaage Kun')
        line = line.replace('bolivia', 'Bolivia')
        line = line.replace('facebook', 'Facebook')
        line = line.replace('australia', 'Australia')
        line = line.replace('sydney', 'Sydney')
        
        new_lines.append(line)
    return '\n'.join(new_lines)

script_dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(os.path.dirname(script_dir), 'nativecamp_library.json')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for article in data['articles']:
    article['content'] = fix_content(article['content'])

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Punctuation and capitalization fixed.")
