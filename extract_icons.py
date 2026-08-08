import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src_path = r"C:\Users\valand utsav\.gemini\antigravity-ide\brain\a2d785a1-26c0-4a08-97be-9d014e7d5352\media__1786188506783.png"
out_dir = r"C:\SAHARAFUND\client\src\assets\categories"
public_out_dir = r"C:\SAHARAFUND\client\public\categories"

os.makedirs(out_dir, exist_ok=True)
os.makedirs(public_out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
w, h = img.size
print(f"Original image size: {w}x{h}")

# Let's find the exact card bounding boxes or icon centers.
# In the 1024x541 image:
# 4 columns, 2 rows
# Let's inspect the cards:
# Cards have horizontal width ~190-200px each, height ~145-155px.
# Centers of cards:
# Row 1 cards Y center ~ 254 (icon center ~ 215)
# Row 2 cards Y center ~ 420 (icon center ~ 380)

# Let's search each quadrant/region for the circular icon:
# Col 1: X ~ 108 to 300 (Center ~ 204)
# Col 2: X ~ 312 to 504 (Center ~ 408)
# Col 3: X ~ 516 to 708 (Center ~ 612)
# Col 4: X ~ 720 to 912 (Center ~ 816)

# Let's scan for the circular badge or icon contents in each of the 8 regions:
# Each icon circle has diameter ~ 48-56px.
# Let's define the 8 regions and crop each cleanly:

regions = [
    {"name": "medical", "label": "Medical Emergency", "center_x": 204, "center_y": 215},
    {"name": "education", "label": "Education", "center_x": 408, "center_y": 215},
    {"name": "disaster", "label": "Disaster Relief", "center_x": 610, "center_y": 215},
    {"name": "startup", "label": "Startup Support", "center_x": 816, "center_y": 215},
    {"name": "sports", "label": "Sports", "center_x": 204, "center_y": 382},
    {"name": "animal", "label": "Animal Rescue", "center_x": 408, "center_y": 382},
    {"name": "personal", "label": "Personal Recovery", "center_x": 610, "center_y": 382},
    {"name": "community", "label": "Community", "center_x": 816, "center_y": 382},
]

# Let's fine-tune the exact circle centers and radii by examining color variance / edges
for r in regions:
    cx, cy = r["center_x"], r["center_y"]
    # Let's crop a window around cx, cy (e.g. 80x80)
    crop_size = 44 # radius
    box = (cx - crop_size, cy - crop_size, cx + crop_size, cy + crop_size)
    cropped = img.crop(box)
    
    # Save a raw crop
    raw_path = os.path.join(out_dir, f"{r['name']}_raw.png")
    cropped.save(raw_path)
    print(f"Saved {raw_path}")

print("Raw crops generated.")
