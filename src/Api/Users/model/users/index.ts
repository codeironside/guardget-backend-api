import { Schema, model } from "mongoose";
import { UserModel } from "../../interfaces/user.dto";

const userSchema = new Schema<UserModel>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
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
      ref: "Roles",
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
    keyholderPhone1: {
      type: String,
      required: true,
    },
    keyholderPhone2: {
      type: String,
    },
    Deactivated: { type: Boolean, default: false },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
    },
    imageurl: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    subId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
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
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual field for subscription
userSchema.virtual("subscription", {
  ref: "Subscription",
  localField: "subId",
  foreignField: "_id",
  justOne: true,
});

// Create text indexes for search functionality
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ firstName: 1 });
userSchema.index({ surName: 1 });

// Add a compound text index for full-text search
userSchema.index(
  {
    email: "text",
    username: "text",
    firstName: "text",
    surName: "text",
  },
  {
    weights: {
      email: 10,
      username: 8,
      firstName: 6,
      surName: 6,
    },
    name: "user_search_index",
  }
);

export const User = model<UserModel>("User", userSchema);
