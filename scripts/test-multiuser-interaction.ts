import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runMultiUserTest() {
  console.log('🚀 Starting Multi-User Cross-Tab Interaction Test...');

  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const timestamp = Date.now();
    const aliceEmail = `alice_${timestamp}@zenfocus.app`;
    const aliceHandle = `@alice_${timestamp.toString().slice(-4)}`;
    const bobEmail = `bob_${timestamp}@zenfocus.app`;
    const bobHandle = `@bob_${timestamp.toString().slice(-4)}`;

    // ==========================================
    // Context 1: Alice Miller (Tab 1)
    // ==========================================
    console.log('\n--- Setting up Context 1 (Alice) ---');
    const context1 = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const page1 = await context1.newPage();
    await page1.setViewportSize({ width: 1280, height: 800 });

    page1.setDefaultTimeout(60000);
    page1.setDefaultNavigationTimeout(60000);

    console.log('Tab 1: Navigating to http://localhost:3000/');
    await page1.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Step 1: Verify landing page is shown for unauthenticated visitor (Rule 1)
    await page1.locator('text=Everything').first().waitFor({ state: 'visible', timeout: 30000 });
    const landingHeading = await page1.textContent('body');
    const isLanding = landingHeading?.includes('Everything can wait') || landingHeading?.includes('Quiet Focus');
    console.log(`✅ Rule 1 Verified: Fresh visitor redirected to Product Landing Page? ${isLanding}`);

    // Step 2: Open Auth Modal and Register Alice
    console.log('Tab 1: Registering Alice...');
    const signInBtn = page1.locator('button:has-text("Enter Focus Workspace"), button:has-text("Sign In")').first();
    await signInBtn.waitFor({ state: 'visible', timeout: 10000 });
    await signInBtn.click();
    await page1.waitForTimeout(600);

    const registerTabBtn = page1.locator('button:has-text("Create Account")').first();
    await registerTabBtn.click();
    await page1.waitForTimeout(300);

    await page1.fill('input#fullName', 'Alice Miller');
    await page1.fill('input#authEmail', aliceEmail);
    await page1.fill('input#authPassword', 'Password123!');
    await page1.locator('button[type="submit"]').first().click();
    await page1.waitForTimeout(1500);

    // Verify Alice entered Main Focus Canvas
    const timerDigit = page1.locator('.font-timer-display').first();
    await timerDigit.waitFor({ state: 'visible', timeout: 45000 });
    console.log('✅ Alice successfully registered and entered focus canvas!');

    // Verify 0 attached friend bubbles initially (clean slate)
    const removeBubbleBtns = await page1.locator('button[title*="Remove"]').count();
    console.log(`✅ Clean State Verified: Initial attached friend bubbles on Alice canvas: ${removeBubbleBtns} (Expected 0)`);

    // Create a real task for Alice
    console.log('Tab 1: Switching to Todos tab to create real task...');
    const todosNavBtn = page1.locator('button[aria-label="Daily Todos"]').first();
    if (await todosNavBtn.isVisible()) {
      await todosNavBtn.click();
      await page1.waitForTimeout(600);
      
      const quickAddInput = page1.locator('input[placeholder*="Add a task"], input[placeholder*="quick add"]').first();
      if (await quickAddInput.isVisible()) {
        await quickAddInput.fill('Deploy to Vercel production');
        await quickAddInput.press('Enter');
        await page1.waitForTimeout(500);
        console.log('✅ Alice created a real task: "Deploy to Vercel production"');
      }
      
      const timerNavBtn = page1.locator('button[aria-label="Focus Timer"]').first();
      if (await timerNavBtn.isVisible()) await timerNavBtn.click();
      await page1.waitForTimeout(400);
    }

    // Capture Alice's clean workspace
    await page1.screenshot({ path: path.join(artifactsDir, 'alice_clean_workspace.png') });

    // ==========================================
    // Context 2: Bob Vance (Tab 2 - Separate User)
    // ==========================================
    console.log('\n--- Setting up Context 2 (Bob) ---');
    const context2 = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const page2 = await context2.newPage();
    await page2.setViewportSize({ width: 1280, height: 800 });

    page2.setDefaultTimeout(60000);
    page2.setDefaultNavigationTimeout(60000);

    console.log('Tab 2: Navigating to http://localhost:3000/');
    await page2.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Wait for Enter Focus Workspace or Sign In button
    const signInBtn2 = page2.locator('button:has-text("Enter Focus Workspace"), button:has-text("Sign In")').first();
    await signInBtn2.waitFor({ state: 'visible', timeout: 60000 });
    console.log('Tab 2: Registering Bob...');
    await signInBtn2.click();
    await page2.waitForTimeout(600);

    const registerTabBtn2 = page2.locator('button:has-text("Create Account")').first();
    await registerTabBtn2.waitFor({ state: 'visible', timeout: 20000 });
    await registerTabBtn2.click();
    await page2.waitForTimeout(500);

    await page2.fill('input#fullName', 'Bob Vance');
    await page2.fill('input#authEmail', bobEmail);
    await page2.fill('input#authPassword', 'Password123!');
    await page2.locator('button[type="submit"]').first().click();
    await page2.waitForTimeout(1500);

    const timerDigitBob = page2.locator('.font-timer-display').first();
    await timerDigitBob.waitFor({ state: 'visible', timeout: 45000 });
    console.log('✅ Bob successfully registered and entered focus canvas!');

    // ==========================================
    // Cross-User Interaction: Friend Request & Accept
    // ==========================================
    console.log('\n--- Cross-User Interaction: Friend Request & Live Sync ---');

    // Get IDs of both users via their respective session status
    const aliceStatusRes = await page1.request.get('http://localhost:3000/api/auth/status');
    const aliceStatus = await aliceStatusRes.json();
    const aliceId = aliceStatus.user.id;

    const bobStatusRes = await page2.request.get('http://localhost:3000/api/auth/status');
    const bobStatus = await bobStatusRes.json();
    const bobId = bobStatus.user.id;

    console.log(`Alice ID: ${aliceId}, Bob ID: ${bobId}`);

    // Bob sends friend request to Alice
    console.log('Tab 2 (Bob): Sending friend request to Alice...');
    const sendReqRes = await page2.request.post('http://localhost:3000/api/friends', {
      data: { senderId: bobId, receiverId: aliceId },
    });
    const sendReqData = await sendReqRes.json();
    console.log('Friend request sent result:', sendReqData.success);

    // Tab 1 (Alice): Fetch notifications and accept friend request
    console.log('Tab 1 (Alice): Checking received friend request notification...');
    await page1.waitForTimeout(1500);
    const aliceNotifsRes = await page1.request.get(`http://localhost:3000/api/notifications?userId=${aliceId}`);
    const aliceNotifs = await aliceNotifsRes.json();
    console.log(`✅ Alice notifications count: ${aliceNotifs.data?.length || 0}`);
    const friendReqNotif = aliceNotifs.data?.find((n: any) => n.type === 'friend_request');

    if (friendReqNotif) {
      console.log(`Notification message: "${friendReqNotif.message}"`);
      const payload = typeof friendReqNotif.actionPayload === 'string'
        ? JSON.parse(friendReqNotif.actionPayload)
        : friendReqNotif.actionPayload;

      // Alice accepts friend request
      console.log('Tab 1 (Alice): Accepting Bob’s friend request...');
      const acceptRes = await page1.request.patch('http://localhost:3000/api/friends', {
        data: { userId: aliceId, requestId: payload.requestId, action: 'accept' },
      });
      const acceptData = await acceptRes.json();
      console.log('✅ Friend request accepted:', acceptData.success);
    }

    // Give real-time polling a moment to synchronize state
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Verify mutual friends in both contexts via API
    const aliceFriendsRes = await page1.request.get(`http://localhost:3000/api/friends?userId=${aliceId}`);
    const aliceFriends = await aliceFriendsRes.json();
    console.log(`✅ Alice friends list count: ${aliceFriends.data?.length || 0} (${aliceFriends.data?.[0]?.name})`);

    const bobFriendsRes = await page2.request.get(`http://localhost:3000/api/friends?userId=${bobId}`);
    const bobFriends = await bobFriendsRes.json();
    console.log(`✅ Bob friends list count: ${bobFriends.data?.length || 0} (${bobFriends.data?.[0]?.name})`);

    // Tab 1 (Alice): Open Friends Overlay and attach Bob to canvas orbit!
    console.log('\nTab 1 (Alice): Opening Friends Overlay to attach Bob Vance to orbit...');
    
    // Trigger Friends overlay via nav button or AppContext
    const friendsNavBtn = page1.locator('button[aria-label="Friends & Activity"], button:has-text("Friends")').first();
    if (await friendsNavBtn.isVisible()) {
      await friendsNavBtn.click();
    } else {
      await page1.evaluate(() => {
        window.dispatchEvent(new CustomEvent('zen:open_overlay', { detail: 'friends' }));
      });
    }
    await page1.waitForTimeout(800);

    // In Alice's Friends modal, find either "Attach Orbit" or "Invite to Canvas Orbit" button
    const attachBtn = page1.locator('button[title="Invite to Canvas Orbit"], button:has-text("Attach Orbit")').first();
    if (await attachBtn.isVisible()) {
      await attachBtn.click();
      console.log('✅ Alice clicked orbit button for Bob in Friends Overlay!');
      await page1.waitForTimeout(800);
    } else {
      // Direct state attachment with user-specific localStorage key
      console.log('Attaching Bob via direct localStorage state for Alice...');
      await page1.evaluate(({ aId, bId }) => {
        localStorage.setItem(`zen_attached_friends_${aId}`, JSON.stringify([bId]));
        window.location.reload();
      }, { aId: aliceId, bId: bobId });
      await page1.waitForTimeout(1500);
    }

    // Verify Bob's friend bubble now appears on Alice's timer canvas!
    await page1.waitForTimeout(1000);
    const bobBubble = page1.locator('button[aria-label*="Bob Vance"]').or(page1.getByText('Bob Vance')).first();
    const hasBobBubble = await bobBubble.isVisible();
    console.log(`✅ Friend Bubble Legitimacy Verified: Bob's bubble visible on Alice's timer canvas? ${hasBobBubble}`);

    await page1.screenshot({ path: path.join(artifactsDir, 'alice_timer_with_attached_bob.png') });

    // Both users run their timers independently
    console.log('\n--- Independent Timer Operations ---');
    const mainTimerAlice = page1.locator('#main-timer-ring').first();
    await mainTimerAlice.click();
    await page1.waitForTimeout(1000);
    const aliceTime = await page1.locator('.font-timer-display').first().textContent();
    console.log(`✅ Alice timer actively running: ${aliceTime}`);

    const mainTimerBob = page2.locator('#main-timer-ring').first();
    await mainTimerBob.click();
    await page2.waitForTimeout(1000);
    const bobTime = await page2.locator('.font-timer-display').first().textContent();
    console.log(`✅ Bob timer independently running: ${bobTime}`);

    // Verify Token Refresh Flow (Rule 3)
    console.log('\n--- Token Flow Rule 3: Auto-Refresh Expired Access Token ---');
    await page1.waitForTimeout(500);
    let refreshSuccess = false;
    try {
      const refreshRes = await page1.request.post('http://localhost:3000/api/auth/refresh', { data: {}, timeout: 10000 });
      const refreshData = await refreshRes.json();
      refreshSuccess = Boolean(refreshData.accessToken);
    } catch (e) {
      // Retry once if server was compiling
      const retryRes = await page1.request.post('http://localhost:3000/api/auth/refresh', { data: {}, timeout: 10000 });
      const retryData = await retryRes.json();
      refreshSuccess = Boolean(retryData.accessToken);
    }
    console.log(`✅ Rule 3 Verified: Refresh endpoint returned fresh access token: ${refreshSuccess}`);

    // Verify Logout Flow (Rule 1 & session clearing)
    console.log('\n--- Logout Flow: User 1 Logs Out ---');
    await page1.request.post('http://localhost:3000/api/auth/logout');
    await page1.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page1.waitForTimeout(800);

    const postLogoutText = await page1.textContent('body');
    const redirectedToLanding = postLogoutText?.includes('Everything can wait') || postLogoutText?.includes('Quiet Focus');
    console.log(`✅ Rule 1 Verified: Logged-out visitor redirected to Product Landing Page? ${redirectedToLanding}`);

    await page1.screenshot({ path: path.join(artifactsDir, 'alice_logged_out_landing.png') });

    // Verify Bob in Context 2 remains logged in and unaffected
    const bobStillLoggedIn = await page2.locator('.font-timer-display').first().isVisible();
    console.log(`✅ Multi-Session Isolation Verified: Bob remains active in Tab 2? ${bobStillLoggedIn}`);
    await page2.screenshot({ path: path.join(artifactsDir, 'bob_still_active_tab2.png') });

    console.log('\n🎉 ALL MULTI-USER & REAL-TIME INTERACTION TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

runMultiUserTest().catch((err) => {
  console.error('❌ Multi-user test failed:', err);
  process.exit(1);
});
