import os
import io
import time
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_DIR = os.path.join(ROOT, 'imagenescartas')
CHARS_DIR = os.path.join(ROOT, 'ImagenesPersonajes')

def optimize_cards(max_w=400, quality=80):
    print(f"=== OPTIMIZING CARDS (max_width={max_w}, q={quality}) ===")
    total_before = 0
    total_after = 0
    count = 0

    for root, dirs, files in os.walk(CARDS_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ('.jpg', '.jpeg', '.png'):
                p = os.path.join(root, f)
                sz_before = os.path.getsize(p)
                total_before += sz_before
                count += 1

                try:
                    with Image.open(p) as img:
                        # Skip 1x1 test images or tiny placeholders
                        if img.width <= 10 or img.height <= 10:
                            total_after += sz_before
                            continue

                        # Convert palette or RGBA to RGB for JPEG
                        img_rgb = img.convert('RGB')

                        # Resize if larger than max_w
                        if img_rgb.width > max_w:
                            ratio = max_w / float(img_rgb.width)
                            new_h = int(img_rgb.height * ratio)
                            img_rgb = img_rgb.resize((max_w, new_h), Image.Resampling.LANCZOS)

                        buf = io.BytesIO()
                        img_rgb.save(buf, format='JPEG', quality=quality, optimize=True)
                        data = buf.getvalue()

                        # Only overwrite if new size is smaller
                        if len(data) < sz_before:
                            with open(p, 'wb') as out_f:
                                out_f.write(data)
                            total_after += len(data)
                        else:
                            total_after += sz_before
                except Exception as e:
                    print(f"Error on {f}: {e}")
                    total_after += sz_before

    saved_mb = (total_before - total_after) / (1024 * 1024)
    print(f"Cards processed: {count}")
    print(f"Size before: {total_before / (1024*1024):.2f} MB")
    print(f"Size after:  {total_after / (1024*1024):.2f} MB")
    print(f"Saved: {saved_mb:.2f} MB ({(1 - total_after/total_before)*100:.1f}%)")

def optimize_characters(max_w=960, quality=82):
    print(f"\n=== OPTIMIZING CHARACTERS (max_width={max_w}, q={quality}) ===")
    total_before = 0
    total_after = 0
    count = 0

    for root, dirs, files in os.walk(CHARS_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ('.jpg', '.jpeg', '.png'):
                p = os.path.join(root, f)
                sz_before = os.path.getsize(p)
                total_before += sz_before
                count += 1

                try:
                    with Image.open(p) as img:
                        if img.width <= 10 or img.height <= 10:
                            total_after += sz_before
                            continue

                        # Check if has alpha transparency
                        has_alpha = (img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info))

                        w, h = img.size
                        target_img = img
                        if w > max_w:
                            r = max_w / float(w)
                            target_img = img.resize((max_w, int(h * r)), Image.Resampling.LANCZOS)

                        buf = io.BytesIO()
                        if has_alpha:
                            target_img.save(buf, format='PNG', optimize=True)
                        else:
                            target_img = target_img.convert('RGB')
                            target_img.save(buf, format='JPEG', quality=quality, optimize=True)

                        data = buf.getvalue()
                        if len(data) < sz_before:
                            with open(p, 'wb') as out_f:
                                out_f.write(data)
                            total_after += len(data)
                        else:
                            total_after += sz_before
                except Exception as e:
                    print(f"Error on {f}: {e}")
                    total_after += sz_before

    saved_mb = (total_before - total_after) / (1024 * 1024)
    print(f"Characters processed: {count}")
    print(f"Size before: {total_before / (1024*1024):.2f} MB")
    print(f"Size after:  {total_after / (1024*1024):.2f} MB")
    print(f"Saved: {saved_mb:.2f} MB ({(1 - total_after/total_before)*100:.1f}%)")

if __name__ == '__main__':
    t0 = time.time()
    optimize_cards(max_w=400, quality=80)
    optimize_characters(max_w=960, quality=82)
    print(f"\nDone in {time.time() - t0:.1f}s")
