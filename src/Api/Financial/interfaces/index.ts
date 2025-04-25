import { Types } from "mongoose";

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