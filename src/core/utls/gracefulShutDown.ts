// src/utils/GracefulShutdown.ts
import { Server } from "http";
import { Socket } from "net";
import chalk from "chalk";

type TeardownFn = () => Promise<void> | void;

export class GracefulShutdown {
  private server: Server;
  private connections = new Set<Socket>();
  private teardownTasks: TeardownFn[] = [];
  private timeoutMs: number;

  constructor(server: Server, timeoutMs = 10000) {
    this.server = server;
    this.timeoutMs = timeoutMs;
    server.on("connection", (socket: Socket) => {
      this.connections.add(socket);
      socket.on("close", () => this.connections.delete(socket));
    });
    ["SIGINT", "SIGTERM"].forEach((sig) =>
      process.on(sig as NodeJS.Signals, () => this.handleShutdown(sig))
    );
  }
  public registerTeardown(fn: TeardownFn): void {
    this.teardownTasks.push(fn);
  }


  public async trigger(): Promise<void> {
    await this.handleShutdown("API_SHUTDOWN");
  }
  private async handleShutdown(signal: string) {
    const timestamp = new Date().toISOString();
    console.log(
      timestamp,
      chalk.green("INFO:"),
      `🛑 Received ${signal}, starting graceful shutdown...`
    );

    this.server.close((err) => {
      if (err) {
        console.error(
          timestamp,
          chalk.red("ERROR:"),
          "Error closing server:",
          err
        );
      }
    });

    for (const task of this.teardownTasks) {
      try {
        await task();
      } catch (e) {
        console.error(
          timestamp,
          chalk.red("ERROR:"),
          "Teardown task error:",
          e
        );
      }
    }

    const killTimer = setTimeout(() => {
      console.warn(
        timestamp,
        chalk.red("ERROR:"),
        "⚡ Forcing shutdown; lingering connections."
      );
      process.exit(0);
    }, this.timeoutMs).unref();

    if (this.connections.size === 0) {
      clearTimeout(killTimer);
      process.exit(0);
    }

    this.connections.forEach((sock) => sock.end());
    this.connections.forEach((sock) => sock.destroy());
  }
}
