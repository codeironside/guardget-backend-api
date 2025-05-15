import { Schema, model } from "mongoose";
import { TransferredDevice } from "../../interface";
import { string } from "zod";
import { DeviceStatus } from "../../interface";

const transferHistory = new Schema<TransferredDevice>(
  {
    name: { type: String, required: [true, "please add device name"] },
    IMIE1: { type: String },
    IMEI2: { type: String },
    Type: { type: String },
    reason: { type: String },
    SN: { type: String, required: [true, "please add a Serial Number"] },
    fromID: {
      type: Schema.Types.ObjectId,
      required: [true, "sender id can not be blanked"],
    },
    status: {
      type: String,
      enum: Object.values(DeviceStatus),
      default: DeviceStatus.ACTIVE,
      required: [true, "device must have a status"],
    },
    toID: {
      type: Schema.Types.ObjectId,
      required: [true, "to Id can not be blanked"],
    },
    transferDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const TransferredDeviceModel = model<TransferredDevice>(
  "TransferredDeviceModel",
  transferHistory
);
