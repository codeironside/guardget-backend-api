import { model, Schema } from "mongoose";
import { ReceiptModel } from "../interfaces";

const ReceiptSchema = new Schema<ReceiptModel>(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    receiptNumber: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscriptions",
      required: true,
    },
  },
  { timestamps: true }
);

export const Receipt = model<ReceiptModel>("Receipt", ReceiptSchema);
