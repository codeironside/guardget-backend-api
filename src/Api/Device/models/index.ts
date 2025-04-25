import { Model, model, Schema } from "mongoose";
import { DeviceModel } from "../interface";



const deviceSchema = new Schema<DeviceModel>({
    name: { type: String, required: [true, "Name is required"] },
    IMIE1: { type: String, required: [true, "IMIE1 is required"] },
    IMEI2: { type: String, },
    SN: { type: String, required: [true, "SN is required"] },
    Type: { type: String, required: [true, "Type is required"] },
    UserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: Boolean, default: false },
})

export const Device = model<DeviceModel>("Device", deviceSchema);