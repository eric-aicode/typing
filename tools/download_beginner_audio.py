import os
import requests
import time

def download_beginner_audio():
    base_url = "https://nativecamp-textbook-file-uploader-prod.s3.amazonaws.com/resources/pronunciation/beginner"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_base_dir = os.path.join(os.path.dirname(script_dir), 'nativecamp_audio', 'beginner')
    
    if not os.path.exists(output_base_dir):
        os.makedirs(output_base_dir)

    # Dictionary mapping lesson ID to potential filenames
    # Structure based on user provided link: 1/1-10.mp3
    # It seems for lesson 1, there is a file named 1-10.mp3
    
    # We will try to download for lessons 1 to 30 (adjust range as needed)
    for lesson_id in range(1, 31):
        lesson_dir = os.path.join(output_base_dir, f"lesson_{lesson_id}")
        
        # Possible filenames based on observation and user input
        # User example: 1/1-10.mp3 (Lesson 1, file 1-10.mp3)
        # It's possible there are individual sentence files like 1.mp3, 2.mp3...
        # and combined files like 1-10.mp3
        potential_files = []
        
        # Individual sentences 1-10
        for i in range(1, 11):
            potential_files.append(f"{i}.mp3")
            
        # Ranges
        potential_files.append(f"1-10.mp3")
        potential_files.append(f"1-5.mp3")
        potential_files.append(f"6-10.mp3")


        print(f"Checking Lesson {lesson_id}...")
        found_any = False

        for filename in potential_files:
            file_url = f"{base_url}/{lesson_id}/{filename}"
            save_path = os.path.join(lesson_dir, filename)
            
            # Check if file already exists to skip
            if os.path.exists(save_path):
                # print(f"  Skipping existing: {filename}")
                found_any = True
                continue

            try:
                # Add delay to be gentle to the server
                time.sleep(1) 
                
                response = requests.get(file_url, stream=True)
                
                if response.status_code == 200:
                    if not os.path.exists(lesson_dir):
                        os.makedirs(lesson_dir)
                        
                    with open(save_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                    print(f"  Downloaded: {filename}")
                    found_any = True
                else:
                    # File not found or other error
                    pass
            except Exception as e:
                print(f"  Error downloading {filename}: {e}")

        if not found_any:
            print(f"  No audio files found for Lesson {lesson_id}")

if __name__ == "__main__":
    download_beginner_audio()
