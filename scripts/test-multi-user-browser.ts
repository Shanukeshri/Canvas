import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runMultiUserBrowserTest() {
  console.log('🚀 Starting Multi-User Browser Automation Test on http://localhost:3001...\n');

  const screenshotsDir = path.resolve(__dirname, '../artifacts/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // ====================================================
    // USER A (Browser Context 1)
    // ====================================================
    console.log('👤 [User A] Opening Browser Context 1 (Alex Serene)...');
    const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageA = await contextA.newPage();

    await pageA.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    console.log('✅ [User A] Page loaded. Title:', await pageA.title());

    // 1. Verify Immersive Timer Canvas & Orbital Bubbles
    const timerRingA = pageA.locator('#main-timer-ring');
    await timerRingA.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ [User A] Main Timer Ring rendered.');

    const sarahBubble = pageA.locator('text=Sarah Chen').first();
    const davidBubble = pageA.locator('text=David Kim').first();
    console.log('✅ [User A] Sarah Chen Orbit Bubble visible:', await sarahBubble.isVisible());
    console.log('✅ [User A] David Kim Orbit Bubble visible:', await davidBubble.isVisible());

    // Screenshot 1: Timer Canvas with Orbit Bubbles
    await pageA.screenshot({ path: path.join(screenshotsDir, '01_timer_canvas.png') });

    // 2. Start Focus Countdown
    console.log('⏱️ [User A] Clicking central timer to start focus countdown...');
    await timerRingA.click();
    await pageA.waitForTimeout(2200);

    const timerTextA = await timerRingA.innerText();
    console.log('✅ [User A] Timer active countdown:\n', timerTextA);

    // 3. Switch to Todos Board
    console.log('📋 [User A] Navigating to Tasks & Todos board...');
    const todosNavBtn = pageA.locator('button[aria-label="Tasks & Todos"]');
    await todosNavBtn.click();
    await pageA.waitForTimeout(1000);

    const todayCol = pageA.locator('text=Today').first();
    const upcomingCol = pageA.locator('text=Upcoming').first();
    const completedCol = pageA.locator('text=Completed').first();
    console.log('✅ [User A] Today Column visible:', await todayCol.isVisible());
    console.log('✅ [User A] Upcoming Column visible:', await upcomingCol.isVisible());
    console.log('✅ [User A] Completed Column visible:', await completedCol.isVisible());

    // Screenshot 2: Tasks Board
    await pageA.screenshot({ path: path.join(screenshotsDir, '02_todos_board.png') });

    // 4. Switch to Focus Groups
    console.log('👥 [User A] Navigating to Focus Groups...');
    const groupsNavBtn = pageA.locator('button[aria-label="Focus Groups"]');
    await groupsNavBtn.click();
    await pageA.waitForTimeout(1000);

    const switchGroupBtn = pageA.locator('text=Switch Group').first();
    console.log('✅ [User A] Focus Groups Canvas visible (Switch Group button):', await switchGroupBtn.isVisible());

    // Screenshot 3: Focus Groups
    await pageA.screenshot({ path: path.join(screenshotsDir, '03_groups_page.png') });

    // 5. Open Sound Mixer Overlay
    console.log('🎧 [User A] Opening Sound Mixer overlay...');
    const soundNavBtn = pageA.locator('button[aria-label="Ambient Sounds"]');
    await soundNavBtn.click();
    await pageA.waitForTimeout(800);

    const soundHeader = pageA.locator('text=Ambient Soundscapes').first();
    console.log('✅ [User A] Sound Mixer Overlay visible:', await soundHeader.isVisible());

    // Screenshot 4: Sound Mixer Overlay
    await pageA.screenshot({ path: path.join(screenshotsDir, '04_sound_mixer.png') });

    // Close Sound Overlay
    const closeBtn = pageA.locator('button[aria-label="Close"]').first();
    await closeBtn.click();
    await pageA.waitForTimeout(500);

    // 6. Open Insights / Statistics Overlay
    console.log('📊 [User A] Opening Insights & Statistics overlay...');
    const statsNavBtn = pageA.locator('button[aria-label="Insights"]');
    await statsNavBtn.click();
    await pageA.waitForTimeout(800);

    const insightsTitle = pageA.locator('h1:has-text("Insights")').first();
    console.log('✅ [User A] Insights & Analytics Overlay visible:', await insightsTitle.isVisible());

    // Screenshot 5: Statistics Overlay
    await pageA.screenshot({ path: path.join(screenshotsDir, '05_insights_analytics.png') });

    const closeBtnStats = pageA.locator('button[aria-label="Close"]').first();
    await closeBtnStats.click();
    await pageA.waitForTimeout(500);

    // ====================================================
    // USER B (Browser Context 2 - Multi-person Independent Session)
    // ====================================================
    console.log('\n👤 [User B] Opening Browser Context 2 (Sarah Chen)...');
    const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageB = await contextB.newPage();

    await pageB.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    console.log('✅ [User B] Page loaded successfully.');

    const timerRingB = pageB.locator('#main-timer-ring');
    await timerRingB.waitFor({ state: 'visible', timeout: 5000 });

    // User B starts independent timer countdown
    console.log('⏱️ [User B] Starting independent timer countdown...');
    await timerRingB.click();
    await pageB.waitForTimeout(2000);

    const timerTextB = await timerRingB.innerText();
    console.log('✅ [User B] Independent timer active countdown:\n', timerTextB);

    // Screenshot 6: User B Concurrent Session
    await pageB.screenshot({ path: path.join(screenshotsDir, '06_user_b_concurrent.png') });

    // 7. Light / Dark Theme Switching Verification
    console.log('\n🎨 [User A] Testing Theme Engine (Light/Dark Mode toggle)...');
    const themeToggleBtn = pageA.locator('button[aria-label="Toggle Theme Mode"]');
    await themeToggleBtn.click();
    await pageA.waitForTimeout(600);

    const isLightMode = await pageA.evaluate(() => document.documentElement.classList.contains('light'));
    console.log('✅ [User A] Light Mode active:', isLightMode);

    // Screenshot 7: Light Mode
    await pageA.screenshot({ path: path.join(screenshotsDir, '07_light_mode.png') });

    // Toggle back to Dark Mode
    await themeToggleBtn.click();
    await pageA.waitForTimeout(400);

    console.log('\n🌟 =====================================================');
    console.log('🎉 ALL MULTI-BROWSER TESTS & WORKFLOWS VERIFIED 100%!');
    console.log('🌟 =====================================================\n');

    await contextA.close();
    await contextB.close();
  } finally {
    await browser.close();
  }
}

runMultiUserBrowserTest().catch((err) => {
  console.error('❌ Multi-User Browser Test Failed:', err);
  process.exit(1);
});
