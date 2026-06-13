const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const screenshotDir = path.join(__dirname, '..', 'screenshots');

  // 1. Login page
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
  await page.setViewport({ width: 1280, height: 800 });
  await page.screenshot({ path: path.join(screenshotDir, '01-login.png'), fullPage: false });
  console.log('✅ Login page screenshot taken');

  // Fill in login form and login
  await page.type('input[type="email"]', 'demo@chatsphere.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for chat view to load
  await page.waitForTimeout(3000);

  // 2. Chat view (empty state)
  await page.screenshot({ path: path.join(screenshotDir, '02-chat-empty.png'), fullPage: false });
  console.log('✅ Chat empty state screenshot taken');

  // 3. Register a second user in a new page for testing
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.screenshot({ path: path.join(screenshotDir, '03-register.png'), fullPage: false });
  console.log('✅ Register page screenshot taken');

  // 4. Fill registration form
  await page2.type('input[placeholder="John Doe"]', 'Alice');
  await page2.type('input[placeholder="johndoe"]', 'alice_user');
  await page2.type('input[placeholder="you@example.com"]', 'alice@test.com');
  await page2.type('input[placeholder="At least 6 characters"]', 'password123');
  await page2.click('button[type="submit"]');
  await page2.waitForTimeout(3000);
  await page2.screenshot({ path: path.join(screenshotDir, '04-chat-alice.png'), fullPage: false });
  console.log('✅ Alice chat view screenshot taken');

  await browser.close();
  console.log('\n🎉 All screenshots saved to /screenshots directory');
})();
