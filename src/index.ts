import http from "http";

import dotenv from "dotenv";
import "module-alias/register";
dotenv.config();
import chalk from "chalk";
import session from "express-session";
import Db from "@/core/utils/database";
import { config } from "./core/utils/config";
import { day } from "@/core/utils/types/global";
import express, { Request, Response } from "express";
import { sessionMiddleware } from "@/core/utils/sessions";
import { errorHandler } from "@/core/middleware/errorHandler";
import { GracefulShutdown } from "@/core/utils/gracefulShutDown";

import { API_SUFFIX } from "@/core/utils/types/global";

const app = express();
app.use(session(sessionMiddleware));
Db.connect();
const server = http.createServer(app);
const shutdown = new GracefulShutdown(server, 15000);

shutdown.registerTeardown(() => Db.disconnect());
import router from "@/App/app.router";
app.use(API_SUFFIX, router);

app.get("/shutdown", (req: Request, res: Response) => {
  res.json({ status: "shutting down" });
  shutdown.trigger();
});
app.get("/ping", (req: Request, res: Response) => {
  res.json({
    status: "GOOD",
    V1: `1.0.0`,
    message: "pong : ✅SERVER HEALTH IS GOOD",
  });
});
server.listen(config.PORT, () => {
  console.log(
    day,
    chalk.green("[INFO:]"),
    ` ✅ server listening on port ${config.PORT} on ${config.NODE_ENV};`
  );
});
app.use(errorHandler);

export { app };
