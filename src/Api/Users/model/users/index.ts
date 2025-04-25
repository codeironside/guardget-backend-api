import { Schema, model } from "mongoose";
import { UserModel } from "../../interfaces/user.dto";

const userSchema = new Schema<UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: [true, "Username already exists"],
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
      type: Schema.Types.ObjectId,
      required: true,
      ref:"Roles"
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
      unique: [true, "Email already exists"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    subId: {
      type: Schema.Types.ObjectId,
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
