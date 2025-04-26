import { Types ,Document} from "mongoose";


export interface ReceiptModel extends Document {
  amount: number;
  date: Date;
  description: string;
  status: string;
  receiptNumber: string;
  userId: mongoose.Types.ObjectId;
  duration: number;
  durationUnit: "days" | "months" | "years";
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptModel{
    id: string;
    amount: number;
    date: Date;
    description: string;
    status: string;
    receiptNumber: string;
    userId: Types.ObjectId;
    subscriptionId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

import mongoose from "mongoose";

export interface PaymentSession {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  amount: number;
  reference: string;
  status: "pending" | "completed" | "failed";
}

export interface PaymentInitializeDTO {
  amount: number;
  subscriptionId: string;
  email: string;
}

export interface PaymentCallbackDTO {
  reference: string;
}