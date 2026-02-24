import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_PATH = path.resolve(__dirname, '../../src/toumei_shippo_designer.html');
const APP_URL = `file://${APP_PATH}`;
const OUTPUT_DIR = './screenshots';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

// アプリを開く
await page.goto(APP_URL, { waitUntil: 'networkidle0' });

// 「はるか」ちゃんのデータを入力
await page.evaluate(() => {
  // 名前
  const nameInput = document.getElementById('name');
  nameInput.value = 'はるか';
  nameInput.dispatchEvent(new Event('input'));

  // 誕生日（3月15日 = 春 → フィボナッチ螺旋）
  const bdayInput = document.getElementById('birthday');
  bdayInput.value = '2025-03-15';
  bdayInput.dispatchEvent(new Event('change'));

  // 出生時刻（朝7:30 → 主副バランス良いブレンド）
  const timeInput = document.getElementById('birthtime');
  timeInput.value = '07:30';
  timeInput.dispatchEvent(new Event('change'));

  // 体重 3200g
  const weightInput = document.getElementById('weight');
  weightInput.value = '3200';
  weightInput.dispatchEvent(new Event('input'));

  // 身長 50cm
  const heightInput = document.getElementById('height');
  heightInput.value = '50';
  heightInput.dispatchEvent(new Event('input'));

  // 天気: 晴れ（デフォルト）
  // 樹種: スギ（デフォルト）

  // 再描画を確実に発火させる
  if (typeof generate === 'function') generate();
});

// 描画完了を待つ
await new Promise(r => setTimeout(r, 500));

// レーザーキャンバスだけをキャプチャ（350×350px）
const laserCanvas = await page.$('#laser-canvas');
if (laserCanvas) {
  await laserCanvas.screenshot({
    path: `${OUTPUT_DIR}/pattern_haruka_laser.png`,
    type: 'png'
  });
  console.log('Captured: pattern_haruka_laser.png');
}

// V溝NCキャンバスもキャプチャ
const vgrooveCanvas = await page.$('#vgroove-canvas');
if (vgrooveCanvas) {
  await vgrooveCanvas.screenshot({
    path: `${OUTPUT_DIR}/pattern_haruka_vgroove.png`,
    type: 'png'
  });
  console.log('Captured: pattern_haruka_vgroove.png');
}

await browser.close();
console.log('Pattern capture done!');
