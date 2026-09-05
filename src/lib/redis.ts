import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const redisUrl = process.env.REDIS_URL;

export const redis: Redis | null = redisUrl
  ? globalForRedis.redis ??
    new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 100, 3000);
      },
    })
  : null;

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}
