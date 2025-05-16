import "module-alias/register";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import chalk from "chalk";
import express, { Request, Response } from "express";
import session from "express-session";

import router from "@/App/app.router";
import Db from "@/core/utils/database";
import { config } from "@/core/utils/config";
import { sessionMiddleware } from "@/core/utils/sessions";
import { errorHandler } from "@/core/middleware/errorHandler";
import { GracefulShutdown } from "@/core/utils/gracefulShutDown";
import { API_SUFFIX } from "@/core/utils/types/global";
import { day } from "@/core/utils/types/global";
import limiter from "./core/utils/ratelimiter";
import path from "path";
import { corsMiddleware } from "./core/utils/cors";
import cors from "cors";
import logger from "./core/logger";
import { redisClient } from "./core/utils/redis";

const app = express();

process.on("exit", (code) => {
  console.log(chalk.yellow(`Process exiting with code: ${code}`));
});
process.on("uncaughtException", (err) => {
  console.error(chalk.red("Uncaught Exception:"), err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    chalk.red("Unhandled Rejection at:"),
    promise,
    "reason:",
    reason
  );
});

(async function initialize() {
  try {
 await redisClient.connect()

    app.use(express.json());
    app.set("trust proxy", false); 
    app.use(corsMiddleware);
    // app.options("*", corsMiddleware);

    app.use(express.urlencoded({ extended: true }));
    app.use(sessionMiddleware);
    app.use(limiter);
    app.use(API_SUFFIX, router);

    app.use(errorHandler);
    const server = http.createServer(app);
    Db.connect();
    app.use(
      "/",
      express.static(path.join(process.cwd(), "public"), {
        maxAge: "1d",
        index: false,
      })
    );
    server.listen(config.PORT, () => {
      logger.info(`✅ server on running ${config.PORT} on ${config.NODE_ENV}`);
    });

    const shutdown = new GracefulShutdown(server, 15000);
    shutdown.registerTeardown(() => Db.disconnect());
    app.get("/ping", (req: Request, res: Response) => {
      res.json({
        status: "GOOD",
        V1: `1.0.0`,
        message: "pong : ✅SERVER HEALTH IS GOOD",
      });
    });

    app.get("/shutdown", (req: Request, res: Response) => {
      res.json({ status: "shutting down" });
      // shutdown.trigger();
    });
  } catch (error) {
    console.error(chalk.red("❌ Failed to initialize server:"), error);
    // Do not exit process immediately, allow for graceful handling or retry
  }
})();

export { app };
