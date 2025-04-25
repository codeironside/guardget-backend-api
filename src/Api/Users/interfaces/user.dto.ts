import { UUID } from "crypto";
import { Types } from "mongoose";

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
}

export interface GetUserById {
  id: string;
}

export interface UserModel {
  id: string;
  username: string;
  firstName: string;
  middleName?: string;
  surName: string;
  role: Types.ObjectId;
  country: string;
  stateOfOrigin: string;
  phoneNumber: string;
  address: string;
  email: string;
  emailVerified: boolean;
  subActive: boolean;
  password: string;
  subId:Types.ObjectId;
  subActiveTill: Date;
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

export interface OTP{
  otp:string;
}

export interface LoginUser{
  email: string;
  password: string;
}

export interface HashedPassword{
  password: string;
}