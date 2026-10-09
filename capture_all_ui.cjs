const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const assetsDir = path.join(__dirname, 'report_assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const pagesToCapture = [
    { url: 'http://localhost:5173/', name: 'real_ui_homepage.png' },
    { url: 'http://localhost:5173/problems', name: 'real_ui_problems.png' },
    { url: 'http://localhost:5173/contests', name: 'real_ui_contests.png' },
    { url: 'http://localhost:5173/leaderboard', name: 'real_ui_leaderboard.png' },
    { url: 'http://localhost:5173/interview-prep', name: 'real_ui_interview.png' },
    { url: 'http://localhost:5173/profile', name: 'real_ui_profile.png' },
    { url: 'http://localhost:5173/admin', name: 'real_ui_admin.png' }
  ];

  for (const item of pagesToCapture) {
    try {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const outPath = path.join(assetsDir, item.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved screenshot: ${item.name}`);
    } catch (err) {
      console.error(`Failed to capture ${item.url}:`, err.message);
    }
  }

  // Also try clicking a problem from the problems page if available to capture code editor
  try {
    await page.goto('http://localhost:5173/problems', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const problemLink = await page.$('a[href*="problem"], tr, .cursor-pointer, button');
    if (problemLink) {
      await problemLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(assetsDir, 'real_ui_editor.png') });
      console.log('Saved screenshot: real_ui_editor.png');
    }
  } catch (err) {
    console.log('Problem link click skipped:', err.message);
  }

  await browser.close();
  console.log('All real UI screenshots captured successfully!');
})();
