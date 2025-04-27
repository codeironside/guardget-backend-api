import { model, Schema } from "mongoose";
import { SubscriptionModel } from "../interface";

const subcriptionSchema = new Schema<SubscriptionModel>(
  {
    name: { type: String, required: [true, "Name is required"] },
    NoOfDevices: {
      type: Number,
      required: [true, "No of devices is required"],
    },
    price: { type: Number, required: [true, "Price is required"] },
    description: { type: String, required: [true, "Description is required"] },
  },
  { timestamps: true }
);
export const Subscription = model<SubscriptionModel>(
  "Subscription",
  subcriptionSchema
);
