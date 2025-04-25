import { Types } from "mongoose";

export interface DeviceModel {
  _id: Types.ObjectId;
  name: string;
  IMIE1: string;
  IMEI2: string;
  SN: string;
  Type: string;
  UserId: Types.ObjectId;
  status: boolean;
}
