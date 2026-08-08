import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

src_path = r"C:\Users\valand utsav\.gemini\antigravity-ide\brain\a2d785a1-26c0-4a08-97be-9d014e7d5352\media__1786188506783.png"
out_dir = r"C:\SAHARAFUND\client\src\assets\categories"
public_out_dir = r"C:\SAHARAFUND\client\public\categories"

os.makedirs(out_dir, exist_ok=True)
os.makedirs(public_out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")

# Card background colors in the reference:
# Medical: light pink
# Education: light blue
# Disaster: light mint/cyan
# Startup: light purple
# Sports: light cream/yellow
# Animal: light peach
# Personal: light rose
# Community: light teal

icons_config = [
    {
        "id": "medical",
        "cx": 204.5, "cy": 224.0, "r": 28.0,
        "bg_color": (254, 247, 248), # card background to turn transparent
        "is_circle": True
    },
    {
        "id": "education",
        "cx": 408.0, "cy": 223.5, "r": 28.0,
        "bg_color": (246, 250, 255),
        "is_circle": True
    },
    {
        "id": "disaster",
        "cx": 612.0, "cy": 223.5, "r": 28.0,
        "bg_color": (244, 253, 249),
        "is_circle": True
    },
    {
        "id": "startup",
        "cx": 816.0, "cy": 223.5, "r": 31.0, # Rocket extends slightly beyond circle
        "bg_color": (250, 248, 255),
        "is_circle": False # Keep full rocket + purple circle with transparent card bg
    },
    {
        "id": "sports",
        "cx": 204.5, "cy": 385.0, "r": 28.0,
        "bg_color": (255, 253, 244),
        "is_circle": True
    },
    {
        "id": "animal",
        "cx": 408.0, "cy": 385.0, "r": 28.0,
        "bg_color": (255, 250, 245),
        "is_circle": True
    },
    {
        "id": "personal",
        "cx": 612.0, "cy": 385.0, "r": 28.0,
        "bg_color": (255, 247, 248),
        "is_circle": True
    },
    {
        "id": "community",
        "cx": 816.0, "cy": 384.5, "r": 28.0,
        "bg_color": (243, 252, 252),
        "is_circle": True
    },
]

# 4x super-sampling for pristine rendering
scale = 4
large_img = img.resize((img.width * scale, img.height * scale), Image.Resampling.LANCZOS)
arr_large = np.array(large_img, dtype=float)

for cfg in icons_config:
    cid = cfg["id"]
    cx = int(round(cfg["cx"] * scale))
    cy = int(round(cfg["cy"] * scale))
    r = int(round(cfg["r"] * scale))
    
    # We want a 256x256 icon
    box_half = int(r * 1.08)
    box = (cx - box_half, cy - box_half, cx + box_half, cy + box_half)
    crop = large_img.crop(box)
    
    target_dim = 256
    crop = crop.resize((target_dim, target_dim), Image.Resampling.LANCZOS)
    
    if cfg["is_circle"]:
        # Circular mask with smooth anti-aliasing
        mask = Image.new("L", (target_dim, target_dim), 0)
        draw = ImageDraw.Draw(mask)
        # Inset slightly for smooth boundary
        margin = int(target_dim * 0.04)
        draw.ellipse((margin, margin, target_dim - margin - 1, target_dim - margin - 1), fill=255)
        # Apply anti-aliasing blur to mask edge
        mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
        
        result = Image.new("RGBA", (target_dim, target_dim), (0, 0, 0, 0))
        result.paste(crop, (0, 0), mask=mask)
    else:
        # For startup / rocket:
        # The rocket is slightly elongated diagonally.
        # Make the card background transparent based on color distance from card background
        crop_arr = np.array(crop, dtype=float)
        bg = np.array(cfg["bg_color"], dtype=float)
        # Calculate color difference from card background
        diff = np.sqrt(np.sum((crop_arr[:, :, :3] - bg)**2, axis=2))
        
        # Soft alpha mask based on diff
        alpha = np.clip((diff - 6.0) / 10.0 * 255.0, 0, 255).astype(np.uint8)
        
        # Also ensure corners beyond rocket/circle are transparent
        mask_corner = Image.new("L", (target_dim, target_dim), 0)
        draw_corner = ImageDraw.Draw(mask_corner)
        draw_corner.ellipse((4, 4, target_dim - 5, target_dim - 5), fill=255)
        mask_corner_arr = np.array(mask_corner)
        
        final_alpha = np.minimum(alpha, mask_corner_arr)
        crop_arr[:, :, 3] = final_alpha
        result = Image.fromarray(crop_arr.astype(np.uint8))

    path1 = os.path.join(out_dir, f"{cid}.png")
    path2 = os.path.join(public_out_dir, f"{cid}.png")
    result.save(path1, "PNG")
    result.save(path2, "PNG")
    print(f"Exported: {cid}.png ({target_dim}x{target_dim})")

# Also copy community or personal as other.png
other_src = os.path.join(out_dir, "personal.png")
other_dest1 = os.path.join(out_dir, "other.png")
other_dest2 = os.path.join(public_out_dir, "other.png")
Image.open(other_src).save(other_dest1)
Image.open(other_src).save(other_dest2)
print("Exported: other.png")

print("All category icon assets exported successfully!")
