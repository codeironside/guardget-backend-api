import * as Express from "express-session";
import { config } from "@/core/utils/config";

export const sessionMiddleware: Express.SessionOptions = {
  name: "sid",
  secret: config.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 1 day
    sameSite: "strict",
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  },
};

declare module "express-session" {
  interface SessionData {
    user: {
      _id?: any;
      otpCode?: any;
      username?: string;
      firstName?: string;
      middleName?: string;
      surName?: string;
      role?: any;
      country?: string;
      stateOfOrigin?: string;
      phoneNumber?: string;
      address?: string;
      email?: string;
      password?: string;
      changepassword?: boolean;
      keyholder?: string;
    };
  }
}
