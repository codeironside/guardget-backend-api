import { Schema, model } from "mongoose";
import { DeviceModel } from "../interface";
export enum DeviceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOST = "lost",
  STOLEN = "stolen",
}

const deviceSchema = new Schema<DeviceModel>(
  {
    name: { type: String, required: [true, "Name is required"] },
    IMIE1: {
      type: String,
      required: [true, "IMIE1 is required"],
      unique: true,
    },
    IMEI2: { type: String, unique: true },
    SN: { type: String, required: [true, "SN is required"], unique: true },
    Type: { type: String, required: [true, "Type is required"] },
    UserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(DeviceStatus),
      default: DeviceStatus.ACTIVE,
      required: [true, "device must have a status"],
    },
  },
  { timestamps: true }
);

export const Device = model<DeviceModel>("Device", deviceSchema);
