const puppeteer = require('puppeteer');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    protocolTimeout: 30000,
  });
  const screenshotDir = path.join(__dirname, '..', 'screenshots');

  // 1. Login page (already taken, skip)
  // 2. Chat empty state - login first
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 800 });
  await page1.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await sleep(2000);
  await page1.type('input[type="email"]', 'demo@chatsphere.com');
  await page1.type('input[type="password"]', 'password123');
  await page1.click('button[type="submit"]');
  await sleep(4000);
  await page1.screenshot({ path: path.join(screenshotDir, '02-chat-empty.png'), fullPage: false });
  console.log('✅ Chat empty state screenshot taken');

  // 3. Register page (already taken, skip)
  // 4. Alice chat view
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto('http://localhost:5174/register', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await sleep(2000);
  await page2.type('input[placeholder="John Doe"]', 'Alice');
  await page2.type('input[placeholder="johndoe"]', 'alice_user');
  await page2.type('input[placeholder="you@example.com"]', 'alice@test.com');
  await page2.type('input[placeholder="At least 6 characters"]', 'password123');
  await page2.click('button[type="submit"]');
  await sleep(4000);
  await page2.screenshot({ path: path.join(screenshotDir, '04-chat-alice.png'), fullPage: false });
  console.log('✅ Alice chat view screenshot taken');

  await browser.close();
  console.log('\n🎉 All screenshots saved to /screenshots directory');
})();
