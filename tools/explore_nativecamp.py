import os
import urllib.request
import time

def probe_and_download():
    base_url = "https://nativecamp-textbook-file-uploader-prod.s3.amazonaws.com/resources/pronunciation/middle"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(os.path.dirname(script_dir), 'nativecamp_audio')
    
    # 網址規則分析：
    # {base_url}/{lesson_id}/{file_name}.mp3
    # lesson_id: 1, 2, 3... (推測可能到 50 或更高)
    # file_name: 1.mp3 到 10.mp3 (小節) 以及 {lesson_id}-{suffix}.mp3 (全課)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 嘗試從第 17 課往後探索到第 50 課
    for lesson in range(17, 51):
        lesson_dir = os.path.join(output_dir, f"lesson_{lesson}")
        found_any = False
        
        # 每一課嘗試探索常見的文件名
        # 1-10 是小節, 1-6 到 1-10 是可能的總結檔
        test_files = [f"{lesson}.mp3"] + [f"{i}.mp3" for i in range(1, 11)] + [f"1-{i}.mp3" for i in range(5, 11)]
        
        print(f"\n--- Probing Lesson {lesson} ---")
        
        for filename in test_files:
            url = f"{base_url}/{lesson}/{filename}"
            filepath = os.path.join(lesson_dir, filename)
            
            try:
                # 使用 request 檢查是否存在，避免直接下載失敗
                req = urllib.request.Request(url, method='HEAD')
                with urllib.request.urlopen(req) as response:
                    if response.status == 200:
                        if not os.path.exists(lesson_dir):
                            os.makedirs(lesson_dir)
                        
                        print(f"Found: {filename}. Downloading...")
                        urllib.request.urlretrieve(url, filepath)
                        found_any = True
                        time.sleep(0.3) # 稍微停頓
            except Exception:
                # 找不到就跳過
                continue
        
        if not found_any:
            print(f"No files found for Lesson {lesson}. Stopping exploration.")
            break
        else:
            print(f"Completed Lesson {lesson}.")

if __name__ == "__main__":
    probe_and_download()
