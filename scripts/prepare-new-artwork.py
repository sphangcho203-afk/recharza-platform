from pathlib import Path
from PIL import Image, ImageOps

source = Path('/home/ubuntu/upload')
target = Path('/home/ubuntu/recharza-platform/public/assets/user-supplied-v2')
target.mkdir(parents=True, exist_ok=True)

files = [
    '1000166199.jpg', '1000166201.jpg', '1000166202.jpg', '1000166205.jpg',
    '1000166207.jpg', '1000166210.jpg', '1000166212.jpg', '1000166213.jpg',
    '1000166214.jpg', '1000166215.jpg', '1000166221.jpg', '1000166222.jpg',
]

for name in files:
    source_image = Image.open(source / name).convert('RGB')
    source_image.save(target / name, quality=92, optimize=True, progressive=True)
    card = ImageOps.fit(source_image, (768, 768), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    card.save(target / name.replace('.jpg', '-card.jpg'), quality=92, optimize=True, progressive=True)
    print(f'{name}: source {source_image.size[0]}x{source_image.size[1]}, card 768x768')
