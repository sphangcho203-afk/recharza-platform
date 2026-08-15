import os
from PIL import Image

def clean_alpha(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    # The generator uses #00FF00 (0, 255, 0) as the temporary background
    # We also handle the black background if it was baked in
    for item in datas:
        # If it's pure green or pure black (common artifacts)
        if (item[0] == 0 and item[1] == 255 and item[2] == 0) or (item[0] == 0 and item[1] == 0 and item[2] == 0):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Resize to 512x512 for web optimization
    img = img.resize((512, 512), Image.Resampling.LANCZOS)
    img.save(path, "PNG")
    print(f"Cleaned and optimized: {path}")

paths = [
    "/home/ubuntu/recharza-platform/public/assets/packs/mobile-legends/diamond-premium.png",
    "/home/ubuntu/recharza-platform/public/assets/packs/mobile-legends/weekly-pass-premium.png",
    "/home/ubuntu/recharza-platform/public/assets/packs/mobile-legends/twilight-pass-premium.png"
]

for p in paths:
    clean_alpha(p)
