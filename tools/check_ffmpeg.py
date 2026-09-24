import imageio_ffmpeg
import os

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
print(f"FFMPEG EXE: {ffmpeg_exe}")
print(f"Exists: {os.path.exists(ffmpeg_exe)}")

# Try to find ffprobe in the same directory
ffmpeg_dir = os.path.dirname(ffmpeg_exe)
ffprobe_exe = os.path.join(ffmpeg_dir, "ffprobe.exe" if os.name == 'nt' else "ffprobe")
print(f"FFPROBE EXE: {ffprobe_exe}")
print(f"Exists: {os.path.exists(ffprobe_exe)}")

# List files in that directory
print(f"Files in {ffmpeg_dir}: {os.listdir(ffmpeg_dir)}")
