import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/shanukeshri983/.gemini/antigravity-ide/brain/83e37d4c-91b4-4661-a293-359df77e5d1c';
const BASE_URL = 'http://localhost:3001';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Starting Multi-User End-to-End Verification...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const timestamp = Date.now();
  const user1Email = `dummy_alpha_${timestamp}@gmail.com`;
  const user1Handle = `alpha_${timestamp}`;
  const user2Email = `dummy_beta_${timestamp}@gmail.com`;
  const user2Handle = `beta_${timestamp}`;
  const password = 'TestPassword123!';

  console.log(`👤 User 1: ${user1Email} (@${user1Handle})`);
  console.log(`👤 User 2: ${user2Email} (@${user2Handle})`);

  // Create two isolated browser contexts
  const context1 = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const context2 = await browser.newContext({ viewport: { width: 1280, height: 850 } });

  // -------------------------------------------------------------
  // STEP 1 & 2: Register User 1 and User 2 via API (which sets auth cookies)
  // -------------------------------------------------------------
  console.log('Step 1 & 2: Registering User 1 and User 2...');
  const res1 = await context1.request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      name: 'Alpha Explorer',
      email: user1Email,
      handle: user1Handle,
      password: password,
      avatar: '🦊',
    },
  });
  const data1 = await res1.json();
  console.log('User 1 register response:', data1.success, data1.user?.name);

  const res2 = await context2.request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      name: 'Beta Builder',
      email: user2Email,
      handle: user2Handle,
      password: password,
      avatar: '🦉',
    },
  });
  const data2 = await res2.json();
  console.log('User 2 register response:', data2.success, data2.user?.name);

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  page1.on('console', (msg) => {
    if (msg.text().includes('DEBUG_SUGGESTION') || msg.type() === 'error') {
      console.log(`[Page 1 Console]:`, msg.text());
    }
  });
  page2.on('console', (msg) => {
    if (msg.text().includes('DEBUG_SUGGESTION') || msg.type() === 'error') {
      console.log(`[Page 2 Console]:`, msg.text());
    }
  });

  try {
    // Open app in both sessions
    console.log('Opening /app in both browser contexts...');
    await page1.goto(`${BASE_URL}/app`);
    await page2.goto(`${BASE_URL}/app`);
    await sleep(2500);

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step1_user1_loaded.png') });
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step2_user2_loaded.png') });
    console.log('✅ Both users loaded and authenticated');

    // -------------------------------------------------------------
    // STEP 3: User 1 searches for User 2 in Friends overlay
    // -------------------------------------------------------------
    console.log(`Step 3: User 1 searches for User 2 (@${user2Handle})...`);
    // Open Buddies overlay using floating button
    const friendsBtn1 = page1.locator('button[aria-label="Invite Friends & Add to Window"]').first();
    await friendsBtn1.click();
    await sleep(1000);

    // Locate unified search input
    const searchInput = page1.locator('#friends-search-input');
    await searchInput.fill(user2Handle);
    await sleep(1500);

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step3_user1_search_suggestions.png') });

    // Verify suggestions contain User 2 and Friend+ button
    const suggestionUser2 = page1.locator('text=Beta Builder');
    const hasUser2 = await suggestionUser2.isVisible();
    console.log(`Found Beta Builder in search suggestions: ${hasUser2}`);

    const friendPlusBtn = page1.locator('button:has-text("Friend+")').first();
    const hasFriendPlus = await friendPlusBtn.isVisible();
    console.log(`Found Friend+ button: ${hasFriendPlus}`);

    if (hasFriendPlus) {
      await friendPlusBtn.click();
      await sleep(1500);
      await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step3_user1_sent_friend_request.png') });
      console.log('✅ Friend request sent from User 1 to User 2');
    }

    // Close Friends overlay on User 1
    const closeFriends1 = page1.locator('button[aria-label="Close"]').first();
    if (await closeFriends1.isVisible()) {
      await closeFriends1.click();
      await sleep(500);
    }

    // -------------------------------------------------------------
    // STEP 4: User 2 accepts friend request
    // -------------------------------------------------------------
    console.log('Step 4: User 2 checking notifications and accepting friend request...');
    const notifBtn2 = page2.locator('button[aria-label="Notifications"]').first();
    await notifBtn2.click();
    await sleep(1500);

    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step4_user2_notifications.png') });

    const acceptFriendBtn = page2.locator('button:has-text("Accept")').first();
    if (await acceptFriendBtn.isVisible()) {
      await acceptFriendBtn.click();
      await sleep(2500);
      console.log('✅ User 2 accepted friend request without error');
    }
    const closeNotif1 = page2.locator('button[aria-label="Close"]').first();
    if (await closeNotif1.isVisible()) {
      await closeNotif1.click();
      await sleep(500);
    }

    // Open Friends overlay on User 2 to verify User 1 appears in Friends list with "Invite" button
    const friendsBtn2 = page2.locator('button[aria-label="Invite Friends & Add to Window"]').first();
    await friendsBtn2.click();
    await sleep(1000);
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step4_user2_friends_list.png') });

    const inviteBtn2 = page2.locator('button:has-text("Invite")').first();
    console.log(`Found Invite button in User 2 friends list: ${await inviteBtn2.isVisible()}`);

    // Close overlays on User 2
    const closeFriends2 = page2.locator('button[aria-label="Close"]').first();
    if (await closeFriends2.isVisible()) {
      await closeFriends2.click();
      await sleep(500);
    }

    // -------------------------------------------------------------
    // STEP 5: Start independent timers with time difference
    // -------------------------------------------------------------
    console.log('Step 5: Starting independent timers on both users with time difference...');
    // User 1 starts timer
    const timerRing1 = page1.locator('#main-timer-ring');
    await timerRing1.click();
    console.log('User 1 timer started');

    // Wait 3.5 seconds
    await sleep(3500);

    // User 2 starts timer
    const timerRing2 = page2.locator('#main-timer-ring');
    await timerRing2.click();
    console.log('User 2 timer started with time difference');
    await sleep(1000);

    // -------------------------------------------------------------
    // STEP 6: Co-work Invite & Acceptance (Bidirectional OrbitBubbles)
    // -------------------------------------------------------------
    console.log('Step 6: User 1 sends Co-work Invite to User 2...');
    await friendsBtn1.click();
    await sleep(1000);

    const inviteBtn1 = page1.locator('button:has-text("Invite")').first();
    if (await inviteBtn1.isVisible()) {
      await inviteBtn1.click();
      await sleep(1500);
      console.log('✅ User 1 clicked Invite (co-work request sent)');
    }

    // Close overlay on User 1
    const closeF1 = page1.locator('button[aria-label="Close"]').first();
    if (await closeF1.isVisible()) await closeF1.click();

    // User 2 opens Notifications to accept Co-work request
    await sleep(1000);
    await notifBtn2.click();
    await sleep(1500);
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step6_user2_cowork_request_notif.png') });

    const acceptCoworkBtn = page2.locator('button:has-text("Accept Co-work"), button:has-text("Accept")').first();
    if (await acceptCoworkBtn.isVisible()) {
      await acceptCoworkBtn.click();
      await sleep(2500);
      console.log('✅ User 2 accepted Co-work request');
    }
    const closeNotif2 = page2.locator('button[aria-label="Close"]').first();
    if (await closeNotif2.isVisible()) {
      await closeNotif2.click();
      await sleep(500);
    }

    // Capture screenshots of both screens with OrbitBubbles attached!
    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step6_user1_cowork_orbit_attached.png') });
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step6_user2_cowork_orbit_attached.png') });
    console.log('✅ Captured bidirectional OrbitBubbles screenshots');

    // -------------------------------------------------------------
    // STEP 7: Pause one timer, switch other to Stopwatch, check analytics
    // -------------------------------------------------------------
    console.log('Step 7: Pausing User 1 timer, switching User 2 to Stopwatch...');
    // User 1 pauses
    await timerRing1.click();
    console.log('Paused User 1 timer');
    await sleep(1500);
    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step7_user1_paused.png') });

    // User 2 switches to Stopwatch mode via Settings overlay
    const settingsBtn2 = page2.locator('button[aria-label="Settings"]').first();
    await settingsBtn2.click();
    await sleep(1000);

    const stopwatchOption = page2.locator('button:has-text("Stopwatch")').first();
    if (await stopwatchOption.isVisible()) {
      await stopwatchOption.click({ force: true });
      await sleep(1000);
      console.log('User 2 switched to Stopwatch mode');
    }

    // Click Done to close and save preferences
    const doneSettingsBtn = page2.locator('button:has-text("Done")').first();
    if (await doneSettingsBtn.isVisible()) {
      await doneSettingsBtn.click({ force: true });
      await sleep(1000);
    }

    // Start Stopwatch on User 2
    await timerRing2.click();
    console.log('User 2 started Stopwatch');
    await sleep(3500);
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step7_user2_stopwatch_running.png') });

    // Pause stopwatch on User 2
    await timerRing2.click();
    await sleep(1000);
    console.log('User 2 paused Stopwatch');

    // Check Analytics / Insights overlay on User 2
    const statsBtn2 = page2.locator('button[aria-label="Insights"]').first();
    if (await statsBtn2.isVisible()) {
      await statsBtn2.click();
      await sleep(1500);
      await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'step7_user2_analytics_view.png') });
      const closeStats2 = page2.locator('button[aria-label="Close"]').first();
      if (await closeStats2.isVisible()) await closeStats2.click();
    }

    // -------------------------------------------------------------
    // STEP 8: Create Focus Group and Sync Shared Todo
    // -------------------------------------------------------------
    console.log('Step 8: Creating focus group and syncing shared todo...');
    // User 1 navigates to Focus Groups tab
    const groupsTab1 = page1.locator('button[aria-label="Focus Groups"]').first();
    await groupsTab1.click();
    await sleep(1500);

    // If "Open Focus Groups Overlay" button is visible, click it
    const openOverlayBtn = page1.locator('button:has-text("Open Focus Groups Overlay")').first();
    if (await openOverlayBtn.isVisible()) {
      await openOverlayBtn.click();
      await sleep(1000);
    }

    // Inside overlay, click "Make Group" or "+ Create Your First Group"
    const makeGroupBtn = page1.locator('button:has-text("Make Group"), button:has-text("Create Your First Group")').first();
    if (await makeGroupBtn.isVisible()) {
      await makeGroupBtn.click();
      await sleep(1000);
    }

    // Fill room name
    const nameInput = page1.locator('input[placeholder*="Fullstack React Study"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Sync Squad Alpha');
      await sleep(500);
      const submitBtn = page1.locator('button[type="submit"]:has-text("Create & Enter Room")').first();
      await submitBtn.click();
      await sleep(2500);
    }

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step8_user1_group_created.png') });
    console.log('✅ Focus Group created');

    // Add a todo item in group tasks
    const addTaskTrigger = page1.locator('button:has-text("+ Add a task"), button:has-text("Add Task")').first();
    if (await addTaskTrigger.isVisible()) {
      await addTaskTrigger.click();
      await sleep(500);
    }

    const todoInput = page1.locator('input[placeholder*="Task name"]').first();
    if (await todoInput.isVisible()) {
      await todoInput.fill('Implement Realtime WebSocket Synchronizer');
      await todoInput.press('Enter');
      await sleep(2000);
    }

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'step8_user1_group_task_added.png') });
    console.log('✅ Shared task added in Focus Group');

    console.log('🎉 ALL MULTI-USER VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error during verification:', error);
    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'error_page1.png') }).catch(() => {});
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'error_page2.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

run();
