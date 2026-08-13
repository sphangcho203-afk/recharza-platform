from pathlib import Path
from PIL import Image, ImageOps

source = Path('/home/ubuntu/upload')
target = Path('/home/ubuntu/recharza-platform/public/assets/user-supplied')
target.mkdir(parents=True, exist_ok=True)

files = [
    '1000166204.jpg', '1000166207.jpg', '1000166209.jpg', '1000166210.jpg',
    '1000166211.jpg', '1000166212.jpg', '1000166213.jpg', '1000166214.jpg',
    '1000166215.jpg', '1000166217.jpg',
]

for name in files:
    image = Image.open(source / name).convert('RGB')
    square = ImageOps.fit(image, (768, 768), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    square.save(target / name, quality=92, optimize=True, progressive=True)
    print(f'{name}: {image.size[0]}x{image.size[1]} -> 768x768')
