import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:8765/slides.html';
const OUTPUT_DIR = './screenshots';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

for (let i = 1; i <= 9; i++) {
  const url = `${BASE_URL}?slide=${i}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Override the scaling script - we have exact 1920x1080 viewport
  await page.evaluate(() => {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((s, idx) => {
      s.style.transform = 'none';
      s.style.transformOrigin = '';
    });
  });

  const filename = `${OUTPUT_DIR}/slide_${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: filename, type: 'png' });
  console.log(`Captured: ${filename}`);
}

await browser.close();
console.log('All slides captured!');
