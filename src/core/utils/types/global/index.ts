export const API_SUFFIX = "/api/v1";
export const day = new Date().toISOString();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


import { SubscriptionModel } from "@/Api/Subscription/interface";
import { PopulatedDoc } from "mongoose";

declare module "@/Api/Users/model/users" {
  interface UserModel {
      subscription?: PopulatedDoc<SubscriptionModel>;
    
  }
}