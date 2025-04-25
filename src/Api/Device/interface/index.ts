import { Types } from "mongoose";

export interface DeviceModel {
  _id: Types.ObjectId;
  name: string;
  IMIE1: string;
  IMEI2: string;
  SN: string;
  Type: string;
  UserId: Types.ObjectId;
  status: string;
}



export enum DeviceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOST = "lost",
  STOLEN = "stolen",
}



export interface DeviceCreateDTO {
  name: string;
  IMIE1: string;
  IMEI2?: string;
  SN: string;
  Type: string;
}

export interface DeviceTransferDto {
  newUserId: string;
}

export interface DeviceStatusUpdateDto {
  status: DeviceStatus;
}

export interface DeviceSearchParams {
  imei: string;
}

export interface DeviceResponse {
  id: string;
  name: string;
  IMIE1: string;
  IMEI2?: string;
  SN: string;
  Type: string;
  status: DeviceStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}