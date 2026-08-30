import redisClient from "../config/redis";

const DEFAULT_TTL_SECONDS = 30 * 60; // 30 minutes

export const setCache = async (
  key: string,
  value: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> => {
  await redisClient.set(key, value, {
    EX: ttlSeconds,
  });
};

export const getCache = async (key: string): Promise<string | null> => {
  return redisClient.get(key);
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export const getCacheTTL = async (key: string): Promise<number> => {
  return redisClient.ttl(key);
};

export const invalidateCacheByPrefix = async (prefix: string): Promise<void> => {
  try {
    let cursor = "0";

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100,
      });

      cursor = String(result.cursor);

      if (result.keys.length > 0) {
        await redisClient.del(result.keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error("Redis cache invalidation failed:", error);

    // Redis failure should not break the API request.
  }
};
