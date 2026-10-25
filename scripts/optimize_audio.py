import os
import subprocess
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSICA_DIR = os.path.join(ROOT, 'musica')
FFMPEG = r'C:\Users\JosueTIR\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'

# 1. Remove known exact duplicates that are now redirected in clean_map_patch.js
duplicates = ['mapa_zexal.mp3', 'tienda_zexal.mp3', 'duelo_zexal.mp3']
for d in duplicates:
    p = os.path.join(MUSICA_DIR, d)
    if os.path.exists(p):
        sz = os.path.getsize(p)
        print(f"Removing duplicate: {d} ({sz / (1024*1024):.2f} MB)")
        os.remove(p)

# 2. Compress remaining tracks
total_before = 0
total_after = 0
count = 0

for f in sorted(os.listdir(MUSICA_DIR)):
    if f.lower().endswith('.mp3'):
        p = os.path.join(MUSICA_DIR, f)
        sz = os.path.getsize(p)
        total_before += sz
        count += 1

        # Skip small sound effects (< 150 KB)
        if sz < 150 * 1024:
            total_after += sz
            continue

        temp_p = os.path.join(MUSICA_DIR, 'tmp_' + f)
        cmd = [
            FFMPEG, '-y', '-i', p,
            '-vn',
            '-codec:a', 'libmp3lame',
            '-b:a', '96k',
            '-ar', '44100',
            temp_p
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(temp_p):
                new_sz = os.path.getsize(temp_p)
                if new_sz < sz:
                    os.replace(temp_p, p)
                    total_after += new_sz
                    print(f"Compressed {f}: {sz/1024/1024:.2f}MB -> {new_sz/1024/1024:.2f}MB ({(1 - new_sz/sz)*100:.1f}%)")
                else:
                    os.remove(temp_p)
                    total_after += sz
        except Exception as e:
            print(f"Error on {f}: {e}")
            if os.path.exists(temp_p):
                os.remove(temp_p)
            total_after += sz

print(f"\nAudio optimization complete!")
print(f"Total before: {total_before / (1024*1024):.2f} MB")
print(f"Total after:  {total_after / (1024*1024):.2f} MB")
print(f"Saved: {(total_before - total_after) / (1024*1024):.2f} MB ({(1 - total_after/total_before)*100:.1f}%)")
