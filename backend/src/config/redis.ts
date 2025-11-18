import {createClient, RedisClientType} from 'redis';
import {logger} from '../utils/logger';

let redisClient: RedisClientType;

export async function initRedis(): Promise<void> {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  await redisClient.connect();
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

// Cache helper functions
export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: string,
  expirySeconds?: number,
): Promise<void> {
  try {
    if (expirySeconds) {
      await redisClient.setEx(key, expirySeconds, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
}

// Leaderboard specific functions using sorted sets
export async function addToLeaderboard(
  userId: string,
  score: number,
): Promise<void> {
  try {
    await redisClient.zAdd('leaderboard:global', {
      score,
      value: userId,
    });
  } catch (error) {
    logger.error('Add to leaderboard error:', error);
  }
}

export async function getLeaderboard(
  limit: number = 100,
): Promise<Array<{userId: string; score: number}>> {
  try {
    const results = await redisClient.zRangeWithScores(
      'leaderboard:global',
      0,
      limit - 1,
      {REV: true},
    );
    return results.map((r) => ({userId: r.value, score: r.score}));
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    return [];
  }
}

export async function getUserRank(userId: string): Promise<number | null> {
  try {
    const rank = await redisClient.zRevRank('leaderboard:global', userId);
    return rank !== null ? rank + 1 : null;
  } catch (error) {
    logger.error('Get user rank error:', error);
    return null;
  }
}
