import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'slides.html');
const outputPath = resolve(__dirname, 'toumei_shippo_proposal.pdf');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
await page.evaluateHandle('document.fonts.ready');

// Get slide count
const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

// Inject CSS to isolate each slide for screenshot
await page.evaluate(() => {
  document.body.style.background = 'none';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
});

// Capture each slide as PNG
const images = [];
for (let i = 0; i < slideCount; i++) {
  const clip = await page.evaluate((idx) => {
    const slide = document.querySelectorAll('.slide')[idx];
    const rect = slide.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }, i);

  const screenshot = await page.screenshot({
    clip,
    type: 'png',
    encoding: 'binary',
  });
  images.push(screenshot);
  console.log(`  Captured slide ${i + 1}/${slideCount}`);
}

// Create a new page that displays images and print to PDF
const pdfPage = await browser.newPage();
const imgTags = images.map((img, i) => {
  const b64 = Buffer.from(img).toString('base64');
  return `<div style="width:1920px;height:1080px;page-break-after:${i < images.length - 1 ? 'always' : 'auto'};overflow:hidden;"><img src="data:image/png;base64,${b64}" style="width:1920px;height:1080px;display:block;"></div>`;
}).join('\n');

const html = `<!DOCTYPE html><html><head><style>
  *{margin:0;padding:0;}
  @page{size:1920px 1080px;margin:0;}
  body{margin:0;padding:0;}
</style></head><body>${imgTags}</body></html>`;

await pdfPage.setContent(html, { waitUntil: 'load' });

await pdfPage.pdf({
  path: outputPath,
  width: '1920px',
  height: '1080px',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`\nPDF generated: ${outputPath}`);
