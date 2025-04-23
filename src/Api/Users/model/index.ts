import { Schema,model } from "mongoose";
import { UserModel } from "../interfaces/user.dto";

const userSchema = new Schema<UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      required: false,
    },
    surName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    stateOfOrigin: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    subActive: { type: Boolean, default: false },
    subActiveTill: {
      type: Date,
    },
    lastLogin: { type: Date },

    password: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);
export const User = model<UserModel>("User", userSchema);