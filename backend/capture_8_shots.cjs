const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const assetsDir = path.join(__dirname, '..', 'report_assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to landing page & performing login...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 15000 });
  
  // Perform login via API call in page context
  await page.evaluate(async () => {
    try {
      const res = await fetch('http://localhost:5174/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'vignesh@example.com', password: 'password123' })
      });
      const data = await res.json();
      console.log('Login success:', data);
    } catch (e) {
      console.error('Login error:', e);
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  await page.reload({ waitUntil: 'networkidle2' });

  // 1. Landing Page
  console.log('Capturing Shot 1: Landing Page...');
  await page.screenshot({ path: path.join(assetsDir, 'shot_1_landing_page.png') });

  // 2. Problems Page
  console.log('Capturing Shot 2: Problems Page (Showing full Problem Set)...');
  await page.goto('http://localhost:5173/problems', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000)); // wait for problems fetch
  await page.screenshot({ path: path.join(assetsDir, 'shot_2_problems_page.png') });

  // 3. Compiler / Code Editor Page
  console.log('Capturing Shot 3: Compiler / Code Editor Workspace...');
  await page.goto('http://localhost:5173/editor', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500)); // wait for Monaco and problem to mount
  await page.screenshot({ path: path.join(assetsDir, 'shot_3_compiler_page.png') });

  // 4. Profile Page (Weakness analysis & stats)
  console.log('Capturing Shot 4: Profile Page (Weakness Analysis & Statistics)...');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'shot_4_profile_page.png') });

  // 5. Contest Page
  console.log('Capturing Shot 5: Contest Hub Page...');
  await page.goto('http://localhost:5173/contests', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'shot_5_contest_page.png') });

  // 6. Admin Page
  console.log('Capturing Shot 6: Admin Dashboard...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'shot_6_admin_page.png') });

  // 7. Contest Adding Page (Admin Manage Contests section)
  console.log('Capturing Shot 7: Contest Adding & Creation View...');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, section'));
    const contestSection = headings.find(el => el.textContent.includes('Manage Contests') || el.textContent.includes('Contest'));
    if (contestSection) {
      contestSection.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo(0, 1100);
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(assetsDir, 'shot_7_contest_adding_page.png') });

  // 8. Final Page (Dashboard / Performance Analysis & Interview Prep)
  console.log('Capturing Shot 8: Final Dashboard & Performance Report Page...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(assetsDir, 'shot_8_final_page.png') });

  await browser.close();
  console.log('All 8 exact UI screenshots captured successfully!');
})();
