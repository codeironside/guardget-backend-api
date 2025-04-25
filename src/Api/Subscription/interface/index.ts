import { Types } from "mongoose";

export interface SubscriptionModel{
    _id: Types.ObjectId;
    name: string;
    NoOfDecives: number;
    price: number;

}