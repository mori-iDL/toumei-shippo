import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';

const BASE_URL = 'http://localhost:8765/slides.html';
const OUTPUT = './toumei_shippo_proposal.pdf';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 1920×1080のビューポート
await page.setViewport({ width: 1920, height: 1080 });

// 全スライド一覧ページを開く（個別ではなく全体）
await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

// 各スライドを1ページとして扱うため、印刷用CSSを注入
await page.addStyleTag({
  content: `
    @media print {
      @page {
        size: 1920px 1080px;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .slide {
        width: 1920px !important;
        height: 1080px !important;
        margin: 0 !important;
        page-break-after: always;
        page-break-inside: avoid;
        box-shadow: none !important;
      }
      .slide:last-child {
        page-break-after: auto;
      }
    }
  `
});

// PDF生成（カスタムサイズ 1920×1080px）
await page.pdf({
  path: OUTPUT,
  width: '1920px',
  height: '1080px',
  printBackground: true,  // 背景色も含める（Slide 1のダーク背景に必須）
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF exported: ${OUTPUT}`);
