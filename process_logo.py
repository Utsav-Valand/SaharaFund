import os
import base64
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src_path = r"C:\Users\valand utsav\.gemini\antigravity-ide\brain\a2d785a1-26c0-4a08-97be-9d014e7d5352\media__1786189827414.png"
assets_dir = r"C:\SAHARAFUND\client\src\assets"
public_dir = r"C:\SAHARAFUND\client\public"

os.makedirs(assets_dir, exist_ok=True)
os.makedirs(public_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")

# Upscale with Lanczos for super-sampled edge quality
upscale_factor = 4
large = img.resize((img.width * upscale_factor, img.height * upscale_factor), Image.Resampling.LANCZOS)
arr = np.array(large, dtype=float)

# Background is ~ [254.0, 254.0, 254.0]
bg_color = np.array([254.0, 254.0, 254.0])
color_diff = np.sqrt(np.sum((arr[:, :, :3] - bg_color)**2, axis=2))

# Find bounding box of foreground
threshold = 12.0
mask_foreground = color_diff > threshold
ys, xs = np.where(mask_foreground)

min_x, max_x = xs.min(), xs.max()
min_y, max_y = ys.min(), ys.max()
cx = (min_x + max_x) / 2.0
cy = (min_y + max_y) / 2.0
w = max_x - min_x
h = max_y - min_y
dim = max(w, h)
padding = int(dim * 0.05)
box_half = int(dim / 2.0 + padding)

crop_box = (
    int(max(0, cx - box_half)),
    int(max(0, cy - box_half)),
    int(min(large.width, cx + box_half)),
    int(min(large.height, cy + box_half))
)

cropped = large.crop(crop_box)
target_size = (512, 512)
cropped = cropped.resize(target_size, Image.Resampling.LANCZOS)

# Create transparent version
cropped_arr = np.array(cropped, dtype=float)
bg = np.array([254.0, 254.0, 254.0])
diff = np.sqrt(np.sum((cropped_arr[:, :, :3] - bg)**2, axis=2))

alpha = np.clip((diff - 6.0) / (28.0 - 6.0) * 255.0, 0, 255).astype(np.uint8)
rgb = cropped_arr[:, :, :3].copy()
final_rgba = np.dstack((rgb.astype(np.uint8), alpha))
logo_transparent = Image.fromarray(final_rgba, mode="RGBA")

# Circular badge version on white
badge_size = (512, 512)
logo_badge = Image.new("RGBA", badge_size, (0, 0, 0, 0))
badge_mask = Image.new("L", badge_size, 0)
draw = ImageDraw.Draw(badge_mask)
draw.ellipse((4, 4, badge_size[0] - 5, badge_size[1] - 5), fill=255)
badge_mask = badge_mask.filter(ImageFilter.GaussianBlur(radius=1.5))
logo_badge.paste(cropped, (0, 0), mask=badge_mask)

# Save high-res PNGs
logo_transparent.save(os.path.join(assets_dir, "logo.png"), "PNG")
logo_transparent.save(os.path.join(public_dir, "logo.png"), "PNG")

logo_badge.save(os.path.join(assets_dir, "logo-badge.png"), "PNG")
logo_badge.save(os.path.join(public_dir, "logo-badge.png"), "PNG")

# Favicon: 128x128
fav_path = os.path.join(public_dir, "favicon.png")
favicon = logo_transparent.resize((128, 128), Image.Resampling.LANCZOS)
favicon.save(fav_path, "PNG")

with open(fav_path, "rb") as f:
    b64_str = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <image href="data:image/png;base64,{b64_str}" width="128" height="128" />
</svg>'''

with open(os.path.join(public_dir, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)

print("Generated logo and favicon assets successfully!")
