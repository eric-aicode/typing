import os
import re

def fix_line(line):
    line = line.strip()
    if not line:
        return ""
    
    # --- Capitalization ---
    # Always capitalize the first letter
    line = line[0].upper() + line[1:]
    
    # Capitalize 'I' (e.g., "i am" -> "I am")
    line = re.sub(r'\bi\b', 'I', line)
    line = re.sub(r'\bi\'ve\b', "I've", line, flags=re.IGNORECASE)
    line = re.sub(r'\bi\'ll\b', "I'll", line, flags=re.IGNORECASE)
    line = re.sub(r'\bi\'m\b', "I'm", line, flags=re.IGNORECASE)
    line = re.sub(r'\bi\'d\b', "I'd", line, flags=re.IGNORECASE)

    # --- Proper Nouns & Brands Fix List (Expanded) ---
    fixes = {
        # Places & Countries
        r'\bparis\b': 'Paris',
        r'\blondon\b': 'London',
        r'\bindia\b': 'India',
        r'\bindia\'s\b': "India's",
        r'\bmumbai\b': 'Mumbai',
        r'\bolivia\b': 'Bolivia',
        r'\bsingapore\b': 'Singapore',
        r'\bmalaysia\b': 'Malaysia',
        r'\baustralia\b': 'Australia',
        r'\baustralian\b': 'Australian',
        r'\bsydney\b': 'Sydney',
        r'\bkyushu\b': 'Kyushu',
        r'\bkagoshima\b': 'Kagoshima',
        r'\btokyo\b': 'Tokyo',
        r'\bjapan\b': 'Japan',
        r'\bjapanese\b': 'Japanese',
        r'\bnew york\b': 'New York',
        
        # Brands & Specific Entities
        r'\bchanel boutique\b': 'Chanel Boutique',
        r'\bjames bond\b': 'James Bond',
        r'\bspecter\b': 'Specter',
        r'\bmachu picchu\b': 'Machu Picchu',
        r'\bkaraage kun\b': 'Karaage Kun',
        r'\blawson\'s\b': "Lawson's",
        r'\bfacebook\b': 'Facebook',
        r'\boakwood tower\b': 'Oakwood Tower',
        r'\bplp architecture\b': 'PLP Architecture',
        r'\bcambridge university\b': 'Cambridge University',
        r'\bsydney harbour bridge\b': 'Sydney Harbour Bridge',
        r'\bnorth pacific\b': 'North Pacific',
        r'\bnative camp\b': 'Native Camp',
        r'\bnct\b': 'NCT',
        r'\bthe little prince\b': 'The Little Prince',
        r'\bwagyu\b': 'Wagyu',
        r'\bempire state building\b': 'Empire State Building',
        r'\bbrooklyn bridge\b': 'Brooklyn Bridge',
        r'\bspice girls\b': 'Spice Girls',
        
        # Persons
        r'\bpeter piper\b': 'Peter Piper',
        r'\bbetty botter\b': 'Betty Botter',
        r'\bprince william\b': 'Prince William',
        r'\bjackson\b': 'Jackson',
        r'\bpeter\b': 'Peter', # From "The Boy Who Cried Wolf"
        
        # Days & Months
        r'\bjanuary\b': 'January',
        r'\bfebruary\b': 'February',
        r'\bmarch\b': 'March',
        r'\bapril\b': 'April',
        r'\bmay\b': 'May',
        r'\bjune\b': 'June',
        r'\bjuly\b': 'July',
        r'\baugust\b': 'August',
        r'\bseptember\b': 'September',
        r'\boctober\b': 'October',
        r'\bnovember\b': 'November',
        r'\bdecember\b': 'December',
        r'\bmonday\b': 'Monday',
        r'\btuesday\b': 'Tuesday',
        r'\bwednesday\b': 'Wednesday',
        r'\bthursday\b': 'Thursday',
        r'\bfriday\b': 'Friday',
        r'\bsaturday\b': 'Saturday',
        r'\bsunday\b': 'Sunday',
        
        # Misc
        r'\bmph\b': 'mph', # Typically lowercase for miles per hour, or MPH
        r'\bam\b': 'a.m.',   # For time, e.g., 10 am
        r'\bpm\b': 'p.m.',
    }
    
    for pattern, replacement in fixes.items():
        line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)
        
    # --- Punctuation ---
    
    # 1. Add period if no punctuation at end
    if not line.endswith(('.', '!', '?', '"', "'", ':')):
        line += '.'
        
    # 2. Fix spacing after punctuation (e.g., "word,word" -> "word, word")
    line = re.sub(r'([,.!?])([a-zA-Z])', r'\1 \2', line)
    
    # 3. Fix double spaces
    line = re.sub(r'\s+', ' ', line)
    
    # 4. Fix specific time formats (e.g., 5: 30 -> 5:30)
    line = re.sub(r'(\d): (\d)', r'\1:\2', line)

    # 4.5 Insert necessary commas (Heuristic)
    # - Before "but" (Fanboys check)
    line = re.sub(r'([a-zA-Z]) but\b', r'\1, but', line, flags=re.IGNORECASE)
    # - After Yes/No at start
    line = re.sub(r'^(yes|no) ([a-zA-Z])', r'\1, \2', line, flags=re.IGNORECASE)
    # - Introductory words
    intro_words = r'^(first|next|then|finally|eventually|suddenly|unfortunately|luckily|however|nevertheless|moreover|furthermore|in addition|for example)\b'
    line = re.sub(intro_words + r' ([a-zA-Z])', r'\1, \2', line, flags=re.IGNORECASE)
    
    # 5. Fix common contraction issues if transcription missed apostrophes
    # (This is harder without context, but some are safe)
    # e.g., "cant" -> "can't", "dont" -> "don't" (Only if whole word)
    contractions = {
        r'\bdont\b': "don't",
        r'\bcant\b': "can't",
        r'\bwont\b': "won't",
        r'\bive\b': "I've",
        r'\bid\b': "I'd",
        r'\bim\b': "I'm",
        r'\bits\b': "it's", # This is risky (possessive vs contraction), but often contraction in speech
        r'\bthats\b': "that's",
        r'\btheres\b': "there's",
        r'\btheyre\b': "they're",
    }
    for pattern, replacement in contractions.items():
       # simple check: if it looks like a contraction missing apostrophe
       line = re.sub(pattern, replacement, line, flags=re.IGNORECASE)

    return line.strip()

def process_transcripts():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.join(os.path.dirname(script_dir), 'transcripts')
    subdirs = ['beginner', 'intermediate']
    
    for subdir in subdirs:
        transcript_dir = os.path.join(base_dir, subdir)
        if not os.path.exists(transcript_dir):
            continue
            
        print(f"Processing directory: {subdir}")
        files = [f for f in os.listdir(transcript_dir) if f.endswith(".txt")]
        
        for filename in files:
            filepath = os.path.join(transcript_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            fixed_lines = [fix_line(l) for l in lines if l.strip()]
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(fixed_lines))
            # print(f"  Fixed {filename}")
    print("Done fixing all transcripts.")

if __name__ == "__main__":
    process_transcripts()
