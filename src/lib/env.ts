import { z } from 'zod';

const isServer = typeof window === 'undefined';

const envSchema = z.object({
  DATABASE_URL: isServer ? z.string().min(1, 'DATABASE_URL is required') : z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  AUTH_SECRET: z.string().default('zen-productivity-secret-key-development-32-chars-long!'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().default('http://localhost:3002'),
  SOCKET_PORT: z.string().default('3002'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL,
  REDIS_URL: process.env.REDIS_URL,
  AUTH_SECRET: process.env.AUTH_SECRET || 'zen-productivity-secret-key-development-32-chars-long!',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002',
  SOCKET_PORT: process.env.SOCKET_PORT || '3002',
  NODE_ENV: process.env.NODE_ENV || 'development',
});
