import { describe, it, expect } from 'vitest';
import {
  createInitialTimerState,
  startTimer,
  pauseTimer,
  resetTimer,
  computeTimerSnapshot,
  calculateFocusContributionMs,
} from '../timer-engine';

describe('Timer Engine (Timestamp-driven State Machine)', () => {
  it('creates an initial idle timer with accurate duration in milliseconds', () => {
    const state = createInitialTimerState('pomodoro', 'focus', 25);
    expect(state.status).toBe('idle');
    expect(state.mode).toBe('pomodoro');
    expect(state.phase).toBe('focus');
    expect(state.durationMs).toBe(25 * 60 * 1000);
    expect(state.elapsedDurationMs).toBe(0);

    const snapshot = computeTimerSnapshot(state);
    expect(snapshot.remainingMs).toBe(25 * 60 * 1000);
    expect(snapshot.remainingSeconds).toBe(1500);
    expect(snapshot.isCompleted).toBe(false);
  });

  it('starts a timer recording exact millisecond timestamp', () => {
    const initial = createInitialTimerState('pomodoro', 'focus', 25);
    const startMs = 1000000;
    const running = startTimer(initial, startMs);

    expect(running.status).toBe('running');
    expect(running.startedAtMs).toBe(startMs);
    expect(running.targetCompletionMs).toBe(startMs + 25 * 60 * 1000);

    // Compute at 12m 37s later (757,000 ms elapsed)
    const nowMs = startMs + 757000;
    const snapshot = computeTimerSnapshot(running, nowMs);

    expect(snapshot.elapsedMs).toBe(757000);
    expect(snapshot.remainingMs).toBe(25 * 60 * 1000 - 757000);
    expect(snapshot.remainingSeconds).toBe(743);
    expect(snapshot.isCompleted).toBe(false);
  });

  it('pauses and resumes without losing elapsed active milliseconds', () => {
    const initial = createInitialTimerState('pomodoro', 'focus', 25);
    const startMs = 1000000;
    const running = startTimer(initial, startMs);

    // Pause 5 minutes later (300,000 ms)
    const pauseMs = startMs + 300000;
    const paused = pauseTimer(running, pauseMs);

    expect(paused.status).toBe('paused');
    expect(paused.elapsedDurationMs).toBe(300000);

    // Resume 10 minutes later (600,000 ms gap in pause)
    const resumeMs = pauseMs + 600000;
    const resumed = startTimer(paused, resumeMs);

    expect(resumed.status).toBe('running');

    // Check snapshot 2 minutes after resume (should be 5m + 2m = 7m total elapsed)
    const snapshot = computeTimerSnapshot(resumed, resumeMs + 120000);
    expect(snapshot.elapsedMs).toBe(420000); // 7 mins
    expect(snapshot.remainingMs).toBe(25 * 60 * 1000 - 420000);
  });

  it('transitions to COMPLETED when duration elapses and remains completed without auto-starting breaks', () => {
    const initial = createInitialTimerState('pomodoro', 'focus', 25);
    const startMs = 1000000;
    const running = startTimer(initial, startMs);

    // 26 minutes later (tab was in background / closed)
    const futureMs = startMs + 26 * 60 * 1000;
    const snapshot = computeTimerSnapshot(running, futureMs);

    expect(snapshot.isCompleted).toBe(true);
    expect(snapshot.state.status).toBe('completed');
    expect(snapshot.remainingSeconds).toBe(0);
    expect(snapshot.progressPercent).toBe(100);
    // Verified: It stays completed without mutating into break phase!
    expect(snapshot.state.phase).toBe('focus');
  });

  it('calculates stopwatch active duration accurately', () => {
    const initial = createInitialTimerState('stopwatch', 'none', 0);
    const startMs = 5000000;
    const running = startTimer(initial, startMs);

    const snapshot = computeTimerSnapshot(running, startMs + 42000);
    expect(snapshot.elapsedSeconds).toBe(42);
    expect(snapshot.remainingSeconds).toBe(0);
  });

  it('calculates partial focus contributions for statistics upon reset or interrupt', () => {
    const initial = createInitialTimerState('pomodoro', 'focus', 25);
    const startMs = 1000000;
    const running = startTimer(initial, startMs);

    // Worked 12m 37s before resetting
    const workedMs = 12 * 60 * 1000 + 37 * 1000;
    const contribution = calculateFocusContributionMs(running, startMs + workedMs);

    expect(contribution).toBe(workedMs);
  });

  it('strictly ensures remaining and elapsed times never go negative', () => {
    const initial = createInitialTimerState('pomodoro', 'focus', 25);
    const startMs = 1000000;
    const running = startTimer(initial, startMs);

    // Snapshot far into the future (10 hours later)
    const futureSnapshot = computeTimerSnapshot(running, startMs + 36000000);
    expect(futureSnapshot.remainingMs).toBeGreaterThanOrEqual(0);
    expect(futureSnapshot.remainingSeconds).toBeGreaterThanOrEqual(0);
    expect(futureSnapshot.remainingMs).toBe(0);
    expect(futureSnapshot.remainingSeconds).toBe(0);

    // Stopwatch far into future
    const stopwatch = createInitialTimerState('stopwatch', 'none', 0);
    const swRunning = startTimer(stopwatch, startMs);
    const swSnapshot = computeTimerSnapshot(swRunning, startMs + 125000);
    expect(swSnapshot.elapsedSeconds).toBe(125);
    expect(swSnapshot.remainingSeconds).toBe(0);
    expect(swSnapshot.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
