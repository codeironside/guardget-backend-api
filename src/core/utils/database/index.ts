// src/database/Database.ts

import mongoose from "mongoose";
import chalk from "chalk";
import { config } from "@/core/utils/config/index";
import Logger from "@/core/logger";

export class Database {
  private uri: string;

  constructor() {
    // Always take the URI from config
    this.uri = config.MONGO_URI;
  }

  public async connect(): Promise<void> {
    const day = new Date().toISOString();

    try {
      await mongoose.connect(this.uri);
      console.log(
        day,
        chalk.green("INFO:"),
        `✅ Successfully connected to the database. on ${config.NODE_ENV}`
      );
      Logger.info("✅ Successfully connected to the database.");
    } catch (err: any) {
      console.error(
        day,
        chalk.red("ERROR:"),
        `❌ Failed to connect to the database: ${err.message || err}`
      );
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    const day = new Date().toISOString();
    try {
      await mongoose.connection.close();
      console.log(
        day,
        chalk.green("INFO:"),
        "✅ Successfully disconnected from the database."
      );
      Logger.info("✅ Successfully disconnected from the database.");
    } catch (err: any) {
      console.error(
        day,
        chalk.red("ERROR:"),
        `❌ Failed to disconnect from the database: ${err.message || err}`
      );
    }
  }
}

export default new Database();
