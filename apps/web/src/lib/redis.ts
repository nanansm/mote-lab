import Redis from "ioredis";
import { logger } from "./logger";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("REDIS_URL environment variable is required");
    }

    redisInstance = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisInstance.on("error", (err) => {
      logger.error({ err }, "Redis connection error");
    });

    redisInstance.on("connect", () => {
      logger.info("Redis connected");
    });
  }

  return redisInstance;
}

export async function checkRedis(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
