import { Types } from "mongoose";

export interface SubscriptionModel{
    _id: Types.ObjectId;
    name: string;
    NoOfDevices: number;
    price: number;
    description:string;

}