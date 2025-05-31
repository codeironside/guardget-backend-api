import { Types } from "mongoose";

export interface DeviceModel {
  _id: Types.ObjectId;
  name: string;
  IMIE1: string;
  IMEI2: string;
  serialNumber: string;
  Type: string;
  location: string;
  description: string;
  UserId: Types.ObjectId;
  purchaseDate: Date;
  status: string;
}

export interface TransferredDevice {
  _id: Types.ObjectId;
  name: string;
  IMIE1?: string;
  IMEI2?: string;
  serialNumber: string;
  Type: string;
  fromID: Types.ObjectId;
  status: string;
  toID: Types.ObjectId;
  reason: string;
  transferDate: Date;
}

export enum DeviceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOST = "lost",
  STOLEN = "stolen",
  TRANSFER_PENDING = "transfer_pending",
  TRANSFER_CANCELLED = "transfer_cancelled",
  TRANSFER_APPROVED = "transfer_approved",
}

export interface DeviceCreateDTO {
  name: string;
  IMIE1?: string;
  IMEI2?: string;
  serialNumber: string;
  Type: string;
  status: string;
}

export interface DeviceTransferDto {
  newUserId: string;
}

export interface DeviceStatusUpdateDto {
  status: DeviceStatus;
  location: string;
  description: string;
}

export interface DeviceSearchParams {
  imei: string;
}

export interface DeviceResponse {
  id: string;
  name: string;
  IMIE1: string;
  IMEI2?: string;
  serialNumber: string;
  Type: string;
  status: DeviceStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    email: string;
  };
}
