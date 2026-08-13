from pathlib import Path
from PIL import Image

names = {
    '1000166218.jpg', '1000166215.jpg', '1000166214.jpg', '1000166213.jpg',
    '1000166202.jpg', '1000166201.jpg', '1000166207.jpg', '1000166205.jpg',
    '1000166199.jpg', '1000166222.jpg', '1000166221.jpg',
}
root = Path('/home/ubuntu/upload')
for path in sorted(root.iterdir()):
    if path.name in names:
        with Image.open(path) as image:
            print(f'{path.name} {image.width}x{image.height}')
