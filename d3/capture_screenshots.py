from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import os

# Create directory for screenshots
os.makedirs("screenshots", exist_ok=True)

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--window-size=1920,1080")

# Initialize the Chrome driver
driver = webdriver.Chrome(options=chrome_options)

# URLs to capture
urls = [
    "http://localhost:12000/index.html",
    "http://localhost:12000/monthly_trends.html",
    "http://localhost:12000/hotel_comparison.html",
    "http://localhost:12000/market_segment.html"
]

# Capture screenshots
for url in urls:
    print(f"Capturing {url}...")
    driver.get(url)
    
    # Wait for page to fully load
    time.sleep(3)
    
    # Get the page name from the URL
    page_name = url.split("/")[-1].split(".")[0]
    if page_name == "index":
        page_name = "home"
    
    # Save screenshot
    screenshot_path = f"screenshots/{page_name}.png"
    driver.save_screenshot(screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

# Close the driver
driver.quit()

print("All screenshots captured successfully!")