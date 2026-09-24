import os
import re

def verify_lessons():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    audio_base = os.path.join(base_dir, "nativecamp_audio")
    transcript_base = os.path.join(base_dir, "transcripts")
    
    cats = ["beginner", "intermediate"]
    
    errors = []
    
    for cat in cats:
        t_dir = os.path.join(transcript_base, cat)
        a_dir = os.path.join(audio_base, cat)
        
        # Get all transcript files
        if not os.path.exists(t_dir):
            print(f"Directory missing: {t_dir}")
            continue
            
        t_files = [f for f in os.listdir(t_dir) if f.endswith(".txt")]
        
        for t_file in t_files:
            # Parse number from lesson_X.txt
            match = re.search(r'lesson_(\d+)\.txt', t_file)
            if not match: continue
            
            num = int(match.group(1))
            
            # Read line count
            t_path = os.path.join(t_dir, t_file)
            with open(t_path, 'r', encoding='utf-8') as f:
                lines = [l for l in f.readlines() if l.strip()]
            
            line_count = len(lines)
            
            # Check audio directory
            # beginner/lesson_X/  or intermediate/lesson_X/
            # BUT intermediate files seem to be directly in intermediate dir?
            # User previous output showed: intermediate directories lesson_1...lesson_30 exist.
            # And also 1.mp3...7.mp3 directly in intermediate?
            # Let's check typical structure. For beginner it is nativecamp_audio/beginner/lesson_X/*.mp3
            
            a_lesson_dir = os.path.join(a_dir, f"lesson_{num}")
            if not os.path.exists(a_lesson_dir):
                # Try simple number
                a_lesson_dir = os.path.join(a_dir, str(num))
                if not os.path.exists(a_lesson_dir):
                     errors.append(f"[{cat}] Lesson {num}: Audio directory missing")
                     continue

            # Count mp3 files (only numeric ones)
            mp3_files = [f for f in os.listdir(a_lesson_dir) if f.lower().endswith(".mp3") and '-' not in f and f.split('.')[0].isdigit()]
            
            # If line count != mp3 count
            if line_count != len(mp3_files):
                errors.append(f"[{cat}] Lesson {num}: Mismatch! Transcript lines={line_count}, Audio files={len(mp3_files)}")
            else:
                # Check consecutive indices
                indices = sorted([int(f.split('.')[0]) for f in mp3_files])
                if not indices:
                   errors.append(f"[{cat}] Lesson {num}: No valid audio files found.")
                elif indices != list(range(1, line_count + 1)):
                    errors.append(f"[{cat}] Lesson {num}: Audio indices broken! Found {indices}")
                else:
                    print(f"[{cat}] Lesson {num}: OK ({line_count} lines)")

    if errors:
        print("\n--- ERRORS FOUND ---")
        for e in errors:
            print(e)
    else:
        print("\nAll lessons verified successfully!")

if __name__ == "__main__":
    verify_lessons()
