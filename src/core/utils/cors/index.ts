import { Request, Response, NextFunction } from "express";
import cors from "cors";
import logger from "@/core/logger";

// Default allowed origins
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

let allowedOrigins: string[] = [...defaultAllowedOrigins];

// Create CORS configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === "development") {
      logger.warn(`Allowing undeclared origin in development: ${origin}`);
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ["set-cookie"],
};

// Export middleware directly
export const corsMiddleware = cors(corsOptions);
