
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import "module-alias/register";

import { errorHandler } from "@/core/middleware/errorHandler";
import express, { Request, Response } from "express";
import { config } from "./core/utls/config";

import Db from "@/core/utls/database";
import { GracefulShutdown } from "@/core/utls/gracefulShutDown";
import chalk from "chalk";
import { API_SUFFIX } from "@/core/utls/types/global";




const app = express();
Db.connect();
const server = http.createServer(app);
const shutdown = new GracefulShutdown(server, 15000);

const day = new Date().toISOString();
shutdown.registerTeardown(() => Db.disconnect());
import router from "@/App/app.router";
app.use(API_SUFFIX, router);


app.post("/shutdown", (req: Request, res: Response) => {
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
