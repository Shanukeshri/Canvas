export type TimerMode = 'pomodoro' | 'stopwatch';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TimerPhase = 'focus' | 'short_break' | 'long_break' | 'none';

export interface BaseTimerState {
  mode: TimerMode;
  phase: TimerPhase;
  durationMs: number; // Configured target duration (0 for stopwatch)
  elapsedDurationMs: number; // Total actual active milliseconds elapsed
}

export interface IdleTimerState extends BaseTimerState {
  status: 'idle';
}

export interface RunningTimerState extends BaseTimerState {
  status: 'running';
  startedAtMs: number;
  pausedDurationMs: number;
  targetCompletionMs?: number; // Only for pomodoro
  lastTickAtMs?: number;
}

export interface PausedTimerState extends BaseTimerState {
  status: 'paused';
  startedAtMs: number;
  pausedAtMs: number;
}

export interface CompletedTimerState extends BaseTimerState {
  status: 'completed';
  startedAtMs: number;
  completedAtMs: number;
}

export type TimerEngineState =
  | IdleTimerState
  | RunningTimerState
  | PausedTimerState
  | CompletedTimerState;

export interface TimerSnapshot {
  state: TimerEngineState;
  remainingMs: number;
  remainingSeconds: number;
  elapsedMs: number;
  elapsedSeconds: number;
  progressPercent: number; // 0 to 100
  isCompleted: boolean;
}

/**
 * Creates initial idle timer state
 */
export function createInitialTimerState(
  mode: TimerMode = 'pomodoro',
  phase: TimerPhase = 'focus',
  durationMinutes: number = 25
): IdleTimerState {
  const durationMs = mode === 'pomodoro' ? durationMinutes * 60 * 1000 : 0;
  return {
    status: 'idle',
    mode,
    phase,
    durationMs,
    elapsedDurationMs: 0,
  };
}

/**
 * Starts or transitions timer into RUNNING state
 */
export function startTimer(
  currentState: TimerEngineState,
  nowMs: number = Date.now()
): RunningTimerState {
  if (currentState.status === 'running') {
    return currentState;
  }

  if (currentState.status === 'paused') {
    // Resuming from pause
    const pausedDurationDelta = nowMs - currentState.pausedAtMs;
    const isPomodoro = currentState.mode === 'pomodoro';
    const remainingMs = Math.max(0, currentState.durationMs - currentState.elapsedDurationMs);

    return {
      status: 'running',
      mode: currentState.mode,
      phase: currentState.phase,
      durationMs: currentState.durationMs,
      elapsedDurationMs: currentState.elapsedDurationMs,
      startedAtMs: currentState.startedAtMs,
      pausedDurationMs: (nowMs - currentState.startedAtMs) - currentState.elapsedDurationMs,
      targetCompletionMs: isPomodoro ? nowMs + remainingMs : undefined,
      lastTickAtMs: nowMs,
    };
  }

  // Starting fresh from IDLE or COMPLETED
  const isPomodoro = currentState.mode === 'pomodoro';
  return {
    status: 'running',
    mode: currentState.mode,
    phase: currentState.phase,
    durationMs: currentState.durationMs,
    elapsedDurationMs: 0,
    startedAtMs: nowMs,
    pausedDurationMs: 0,
    targetCompletionMs: isPomodoro ? nowMs + currentState.durationMs : undefined,
    lastTickAtMs: nowMs,
  };
}

/**
 * Pauses a RUNNING timer
 */
export function pauseTimer(
  currentState: TimerEngineState,
  nowMs: number = Date.now()
): PausedTimerState | TimerEngineState {
  if (currentState.status !== 'running') {
    return currentState;
  }

  const activeElapsed = Math.max(0, nowMs - currentState.startedAtMs - currentState.pausedDurationMs);

  return {
    status: 'paused',
    mode: currentState.mode,
    phase: currentState.phase,
    durationMs: currentState.durationMs,
    elapsedDurationMs: activeElapsed,
    startedAtMs: currentState.startedAtMs,
    pausedAtMs: nowMs,
  };
}

/**
 * Resets a timer back to IDLE
 */
export function resetTimer(
  currentState: TimerEngineState,
  newDurationMinutes?: number
): IdleTimerState {
  const durationMs =
    newDurationMinutes !== undefined
      ? newDurationMinutes * 60 * 1000
      : currentState.mode === 'pomodoro'
      ? currentState.durationMs
      : 0;

  return {
    status: 'idle',
    mode: currentState.mode,
    phase: currentState.phase,
    durationMs,
    elapsedDurationMs: 0,
  };
}

/**
 * Changes timer phase (e.g. FOCUS -> SHORT_BREAK -> LONG_BREAK)
 */
export function changeTimerPhase(
  currentState: TimerEngineState,
  phase: TimerPhase,
  durationMinutes: number
): IdleTimerState {
  return {
    status: 'idle',
    mode: 'pomodoro',
    phase,
    durationMs: durationMinutes * 60 * 1000,
    elapsedDurationMs: 0,
  };
}

/**
 * Calculates current active snapshot at exact timestamp nowMs
 */
export function computeTimerSnapshot(
  state: TimerEngineState,
  nowMs: number = Date.now()
): TimerSnapshot {
  switch (state.status) {
    case 'idle': {
      const remainingMs = state.mode === 'pomodoro' ? state.durationMs : 0;
      return {
        state,
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        elapsedMs: 0,
        elapsedSeconds: 0,
        progressPercent: 0,
        isCompleted: false,
      };
    }

    case 'running': {

      if (state.mode === 'stopwatch') {
        const elapsedMs = Math.max(0, nowMs - state.startedAtMs - state.pausedDurationMs);
        return {
          state: {
            ...state,
            elapsedDurationMs: elapsedMs,
            lastTickAtMs: nowMs,
          },
          remainingMs: 0,
          remainingSeconds: 0,
          elapsedMs,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
          progressPercent: 0,
          isCompleted: false,
        };
      }

      // Pomodoro Mode
      const totalElapsedMs = Math.max(0, nowMs - state.startedAtMs - state.pausedDurationMs);
      const remainingMs = Math.max(0, state.durationMs - totalElapsedMs);

      if (remainingMs <= 0) {
        // Pomodoro Completed!
        const completedState: CompletedTimerState = {
          status: 'completed',
          mode: state.mode,
          phase: state.phase,
          durationMs: state.durationMs,
          startedAtMs: state.startedAtMs,
          completedAtMs: state.startedAtMs + state.pausedDurationMs + state.durationMs,
          elapsedDurationMs: state.durationMs,
        };

        return {
          state: completedState,
          remainingMs: 0,
          remainingSeconds: 0,
          elapsedMs: state.durationMs,
          elapsedSeconds: Math.floor(state.durationMs / 1000),
          progressPercent: 100,
          isCompleted: true,
        };
      }

      const progress = state.durationMs > 0 ? (totalElapsedMs / state.durationMs) * 100 : 0;
      return {
        state: {
          ...state,
          elapsedDurationMs: totalElapsedMs,
          lastTickAtMs: nowMs,
        },
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        elapsedMs: totalElapsedMs,
        elapsedSeconds: Math.floor(totalElapsedMs / 1000),
        progressPercent: Math.min(100, progress),
        isCompleted: false,
      };
    }

    case 'paused': {
      const elapsedMs = state.elapsedDurationMs;
      const remainingMs =
        state.mode === 'pomodoro' ? Math.max(0, state.durationMs - elapsedMs) : 0;
      const progress =
        state.mode === 'pomodoro' && state.durationMs > 0
          ? (elapsedMs / state.durationMs) * 100
          : 0;

      return {
        state,
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        elapsedMs,
        elapsedSeconds: Math.floor(elapsedMs / 1000),
        progressPercent: Math.min(100, progress),
        isCompleted: false,
      };
    }

    case 'completed': {
      return {
        state,
        remainingMs: 0,
        remainingSeconds: 0,
        elapsedMs: state.elapsedDurationMs,
        elapsedSeconds: Math.floor(state.elapsedDurationMs / 1000),
        progressPercent: 100,
        isCompleted: true,
      };
    }
  }
}

/**
 * Calculates historical focus contribution from timer session or checkpoint
 */
export function calculateFocusContributionMs(
  state: TimerEngineState,
  nowMs: number = Date.now()
): number {
  if (state.status === 'idle') return 0;
  if (state.status === 'completed') return state.durationMs;
  if (state.status === 'paused') return state.elapsedDurationMs;

  // Running
  if (state.mode === 'stopwatch') {
    return Math.max(0, nowMs - state.startedAtMs - state.pausedDurationMs);
  }
  const elapsed = Math.max(0, nowMs - state.startedAtMs - state.pausedDurationMs);
  return Math.min(state.durationMs, elapsed);
}
