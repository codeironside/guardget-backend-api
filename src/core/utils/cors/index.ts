import { Request, Response, NextFunction } from "express";
import cors from "cors";
import logger from "@/core/logger";

// Default allowed origins
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://g718dksk-3000.uks1.devtunnels.ms",
  "https://v0.dev",
  "https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5173--2e03455b.local-credentialless.webcontainer-api.io",
  "http://localhost:5173",
  "https://v0-guardget-frontend-structure.vercel.app/",
  "https://43b0-102-90-82-208.ngrok-free.app",
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
