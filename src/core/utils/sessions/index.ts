import session from "express-session";
import connectRedis from "connect-redis";
import { redisClient } from "../redis";
import { config } from "../config";

// const RedisStore = connectRedis(session);


export const sessionMiddleware = session({
  name: "sid",
  secret: config.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
  },
  rolling: true,
});

// Type declarations for session data
declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
    // Add custom session properties here
  }
}
