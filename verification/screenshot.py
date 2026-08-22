import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        
        routes = [
            ("/", "home"),
            ("/account/orders", "orders"),
            ("/support", "support"),
            ("/games/mobile-legends/india", "game_page"),
            ("/cart", "cart"),
            ("/admin/login", "admin_login")
        ]
        
        for route, name in routes:
            try:
                await page.goto(f"http://localhost:3000{route}")
                await asyncio.sleep(2)  # Wait for animations
                await page.screenshot(path=f"/home/ubuntu/recharza-platform/verification/{name}.png", full_page=True)
                print(f"Captured {name}")
            except Exception as e:
                print(f"Failed to capture {name}: {e}")
        
        await browser.close()

asyncio.run(run())
