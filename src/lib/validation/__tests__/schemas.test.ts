import { describe, it, expect } from 'vitest';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateGroupSchema,
  FriendRequestSchema,
  TimerPresetSchema,
  ProfileSchema,
} from '../schemas';

describe('Zod Validation Schemas', () => {
  it('validates CreateTaskSchema with defaults and bounds', () => {
    const valid = CreateTaskSchema.parse({
      title: 'Build Route Handler Tests',
    });
    expect(valid.title).toBe('Build Route Handler Tests');
    expect(valid.priority).toBe('medium');
    expect(valid.project).toBe('General Focus');
    expect(valid.completed).toBe(false);

    expect(() => CreateTaskSchema.parse({ title: '' })).toThrow();
  });

  it('validates CreateGroupSchema with minimum 2 characters', () => {
    const valid = CreateGroupSchema.parse({
      name: 'Deep Study Group',
      description: 'Quiet focus room',
    });
    expect(valid.name).toBe('Deep Study Group');
    expect(valid.category).toBe('Focus Room');

    expect(() => CreateGroupSchema.parse({ name: 'A' })).toThrow();
  });

  it('validates FriendRequestSchema target user ID', () => {
    const valid = FriendRequestSchema.parse({
      receiverId: 'user-123',
    });
    expect(valid.receiverId).toBe('user-123');

    expect(() => FriendRequestSchema.parse({ receiverId: '' })).toThrow();
  });

  it('validates TimerPresetSchema bounds', () => {
    const valid = TimerPresetSchema.parse({
      name: 'Sprint Focus',
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      targetSessions: 4,
      autoStartBreaks: false,
      soundOnComplete: true,
    });
    expect(valid.focusMinutes).toBe(50);

    // Exceeding maximum 180 min
    expect(() =>
      TimerPresetSchema.parse({
        name: 'Invalid',
        focusMinutes: 250,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        targetSessions: 4,
      })
    ).toThrow();
  });

  it('validates ProfileSchema and handles', () => {
    const valid = ProfileSchema.parse({
      name: 'Alex Johnson',
      handle: '@alex_dev',
      avatar: '🦊',
      themeColor: '#6366f1',
    });
    expect(valid.handle).toBe('@alex_dev');

    // Invalid handle containing spaces or symbols
    expect(() =>
      ProfileSchema.parse({
        name: 'Alex',
        handle: 'alex dev space!',
        avatar: '🦊',
        themeColor: '#6366f1',
      })
    ).toThrow();
  });
});
