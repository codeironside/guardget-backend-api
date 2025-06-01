import { UUID } from "crypto";
import { Types, Document, PopulatedDoc } from "mongoose";
import { SubscriptionModel } from "@/Api/Subscription/interface";

export interface CreateUserDTO {
  username: string;
  Contact: string;
  firstName: string;
  middleName?: string;
  surName: string;
  country: string;
  stateOfOrigin: string;
  address: string;
  role: string;
  phoneNumber: string;
  email: string;
  password: string;
  keyholder: string;
  keyholderPhone1: string;
  keyholderPhone2: string;
}

export interface GetUserById {
  id: string;
}

export interface UserModel extends Document {
  id: string;
  username: string;
  firstName: string;
  middleName?: string;
  surName: string;
  role: Types.ObjectId;
  country: string;
  stateOfOrigin: string;
  phoneNumber: string;
  email: string;
  emailVerified: boolean;
  subActive: boolean;
  keyholder: string;
  keyholderPhone1: string;
  keyholderPhone2: string;
  password: string;
  Deactivated: boolean;
  subId?: PopulatedDoc<SubscriptionModel>;
  subActiveTill: Date;
  imageurl?: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolesModel {
  _id: Types.ObjectId;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OTP {
  otp: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface HashedPassword {
  password: string;
}
