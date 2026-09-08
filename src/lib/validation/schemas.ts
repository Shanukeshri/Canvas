import { z } from 'zod';

export const PrioritySchema = z.enum(['low', 'medium', 'high']);
export const TimerModeSchema = z.enum(['pomodoro', 'stopwatch']);
export const TimerStatusSchema = z.enum(['idle', 'running', 'paused', 'completed']);
export const TimerPhaseSchema = z.enum(['focus', 'short_break', 'long_break', 'none']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title cannot exceed 200 characters'),
  project: z.string().default('General Focus'),
  priority: PrioritySchema.default('medium'),
  dueDate: z.string().optional().default('Today'),
  description: z.string().max(1000).optional().default(''),
  assignedTo: z.string().optional(),
  groupId: z.string().optional(),
  completed: z.boolean().optional().default(false),
});

export const UpdateTaskSchema = z.object({
  id: z.string().min(1, 'Task ID required'),
  title: z.string().min(1).max(200).optional(),
  project: z.string().optional(),
  priority: PrioritySchema.optional(),
  dueDate: z.string().optional(),
  description: z.string().max(1000).optional(),
  assignedTo: z.string().optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().optional().nullable(),
  order: z.number().optional(),
  groupId: z.string().optional().nullable(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(50, 'Group name cannot exceed 50 characters'),
  description: z.string().max(300).optional().default(''),
  category: z.string().default('Focus Room'),
  code: z.string().optional(),
});

export const UpdateGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(300).optional(),
  category: z.string().optional(),
});

export const FriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Target user ID is required'),
});

export const GroupInvitationSchema = z.object({
  groupId: z.string().min(1, 'Group ID required'),
  friendId: z.string().min(1, 'Friend ID required'),
});

export const TimerPresetSchema = z.object({
  name: z.string().min(1).max(50),
  focusMinutes: z.number().min(1).max(180),
  shortBreakMinutes: z.number().min(1).max(60),
  longBreakMinutes: z.number().min(1).max(90),
  targetSessions: z.number().min(1).max(24),
  autoStartBreaks: z.boolean().default(false),
  soundOnComplete: z.boolean().default(true),
});

export const SoundMixSchema = z.object({
  name: z.string().min(1, 'Mix name required').max(50),
  tracks: z.array(
    z.object({
      soundId: z.string(),
      volume: z.number().min(0).max(100),
    })
  ).min(1, 'At least one sound track required'),
});

export const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  handle: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_@]+$/, 'Invalid handle format'),
  avatar: z.string().min(1),
  themeColor: z.string().min(1),
});

export const AuthLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AuthRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  handle: z.string().optional(),
  avatar: z.string().optional(),
});

export const UserSearchSchema = z.object({
  q: z.string().min(1).max(100),
});

export const FocusSessionSchema = z.object({
  id: z.string().optional(),
  type: TimerModeSchema,
  taskId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  startedAtMs: z.number(),
  endedAtMs: z.number(),
  elapsedDurationMs: z.number(),
  status: z.enum(['completed', 'interrupted', 'running']).default('completed'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type FriendRequestInput = z.infer<typeof FriendRequestSchema>;
export type GroupInvitationInput = z.infer<typeof GroupInvitationSchema>;
export type TimerPresetInput = z.infer<typeof TimerPresetSchema>;
export type SoundMixInput = z.infer<typeof SoundMixSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;
export type AuthRegisterInput = z.infer<typeof AuthRegisterSchema>;
export type FocusSessionInput = z.infer<typeof FocusSessionSchema>;
