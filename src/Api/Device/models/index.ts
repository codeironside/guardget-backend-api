import { Schema, model } from "mongoose";
import { DeviceModel } from "../interface";

export enum DeviceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MISSING = "missing",
  STOLEN = "stolen",
  TRANSFER_PENDING = "transfer_pending",
}

const deviceSchema = new Schema<DeviceModel>(
  {
    name: { type: String, required: [true, "Name is required"] },
    IMIE1: {
      type: String,
      unique: true,
      sparse: true,
    },
    IMEI2: {
      type: String,
      unique: true,
      sparse: true,
    },
    serialNumber: {
      type: String,
      required: [true, "serialNumber is required"],
      unique: true,
    },
    Type: { type: String, required: [true, "Type is required"] },
    UserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purchaseDate: { type: Date, required: [true, "date is required"] },
    status: {
      type: String,
      enum: Object.values(DeviceStatus),
      default: DeviceStatus.ACTIVE,
      required: [true, "device must have a status"],
    },
    location: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

// Ensure proper indexes
deviceSchema.index({ IMIE1: 1 }, { unique: true, sparse: true });
deviceSchema.index({ IMEI2: 1 }, { unique: true, sparse: true });
deviceSchema.index({ serialNumber: 1 }, { unique: true });

export const Device = model<DeviceModel>("Device", deviceSchema);
