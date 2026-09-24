import os
import speech_recognition as sr
import imageio_ffmpeg
import subprocess
import time

def transcribe_beginner():
    # Set paths for beginner audio and transcripts
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    base_dir = os.path.join(project_root, 'nativecamp_audio', 'beginner')
    output_text_dir = os.path.join(project_root, 'transcripts', 'beginner')
    
    if not os.path.exists(output_text_dir):
        os.makedirs(output_text_dir)
        
    recognizer = sr.Recognizer()
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    
    # Process lessons 1 to 30
    for lesson in range(1, 31):
        lesson_dir = os.path.join(base_dir, f"lesson_{lesson}")
        if not os.path.exists(lesson_dir):
            continue
            
        output_file = os.path.join(output_text_dir, f"lesson_{lesson}.txt")
        if os.path.exists(output_file):
            print(f"Skipping Beginner Lesson {lesson} (already transcribed)")
            continue
            
        print(f"\n--- Transcribing Beginner Lesson {lesson} ---")
        # Determine max index to know loop range, or just process all matches
        # Better: store results in a dict {index: text}
        results_map = {}
        max_idx = 0

        # Sort files to find max index or just iterate all
        files = [f for f in os.listdir(lesson_dir) if f.endswith(".mp3") and '-' not in f and f.split('.')[0].isdigit()]
        
        for filename in files:
            try:
                idx = int(filename.split('.')[0])
                if idx > max_idx: max_idx = idx
            except: pass

        # Sort files effectively by index
        files.sort(key=lambda x: int(x.split('.')[0]))

        for filename in files:
            idx = int(filename.split('.')[0])
            filepath = os.path.join(lesson_dir, filename)
            temp_wav = os.path.join(lesson_dir, f"temp_{lesson}_{filename}.wav")
            
            try:
                # Convert mp3 to wav
                cmd = [ffmpeg_path, "-y", "-i", filepath, temp_wav]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Recognize speech
                text = ""
                with sr.AudioFile(temp_wav) as source:
                    audio_data = recognizer.record(source)
                    try:
                        text = recognizer.recognize_google(audio_data, language="en-US")
                    except sr.UnknownValueError:
                        text = "[Unrecognized Audio]"
                    except sr.RequestError:
                        text = "[API Error]"
                
                print(f"L{lesson} {filename}: {text}")
                results_map[idx] = text
                    
                # Clean up immediately
                if os.path.exists(temp_wav):
                    os.remove(temp_wav)
            except Exception as e:
                print(f"Error processing {filename}: {e}")
                results_map[idx] = "[Error]"
                if os.path.exists(temp_wav):
                     os.remove(temp_wav)

        # Reconstruct list respecting indices 1..max_idx
        # If an index is missing (e.g. 1, 3, 4 -> missing 2), we probably should skip it or insert empty?
        # NativeCamp likely has continuous indices.
        # But wait, if nativecamp_script plays `index+1`, it implies 0-based array matches 1-based files.
        # So we need array[0] = content of 1.mp3
        # array[1] = content of 2.mp3
        # If 2.mp3 is missing, we should probably have empty string to keep alignment?
        # Or if 2.mp3 doesn't exist, maybe it shouldn't be playable?
        # Let's fill holes with empty strings to maintain alignment.
        
        final_lines = []
        if max_idx > 0:
            for i in range(1, max_idx + 1):
                final_lines.append(results_map.get(i, ""))
        
        # Write to file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n".join(final_lines))

if __name__ == "__main__":
    transcribe_beginner()
