// src/core/redis.ts
import { createClient } from "redis";
import { config } from "../config";
import logger from "@/core/logger";

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private static instance: RedisClient;

  private constructor() {
    this.client = createClient({
      url: `redis://${config.REDIS_USERNAME}:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}`,
      socket: {
        tls: config.REDIS_TLS === "true",
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error("Too many retries on Redis. Connection Terminated");
            return new Error("Too many retries");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on("error", (err: Error) => {
      logger.error(`Redis Client Error: ${err.message}`);
    });

    this.client.on("ready", () => {
      logger.info("Redis connection established");
    });

    this.client.on("end", () => {
      logger.warn("Redis connection closed");
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public getClient() {
    return this.client;
  }
}

export const redisClient = RedisClient.getInstance();
