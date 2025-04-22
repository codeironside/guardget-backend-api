/// <reference path="@/core/utls/types/global/global.d.ts" />
import http from "http";
import dotenv from "dotenv";
import "module-alias/register";

import { errorHandler } from "@/core/middleware/errorHandler";
import express, { Request, Response } from "express";

import Db from "@/core/utls/database";
import { GracefulShutdown } from "@/core/utls/gracefulShutDown";
import chalk from "chalk";

dotenv.config();

import { Logger } from "@/core/logger/index";
import { BadRequestError } from "@/core/error";
import { Whatsapp } from "@/core/services/whatsapp";
import { Config } from "@/core/utls/config/index";

globalThis.logger = Logger;
globalThis.BadRequestError = BadRequestError;
globalThis.whatsapp = Whatsapp;
globalThis.config = Config;

const app = express();
Db.connect();
const server = http.createServer(app);
const shutdown = new GracefulShutdown(server, 15000);

const day = new Date().toISOString();
shutdown.registerTeardown(() => Db.disconnect());

import "app/app.routes";

app.post("/shutdown", (req: Request, res: Response) => {
  res.json({ status: "shutting down" });
  shutdown.trigger();
});
app.post("/ping", (req: Request, res: Response) => {
  res.json({
    status: "GOOD",
    V1: `1.0.0`,
    message: "pong :SERVER HEALTH IS GOOD",
  });
});
server.listen(config.PORT, () => {
  console.log(
    day,
    chalk.green("INFO:"),
    ` server listening on port ${config.PORT} on ${config.NODE_ENV};`
  );
});
app.use(errorHandler);

export { app };
