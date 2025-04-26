import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import {
  DeviceCreateDTO,
  DeviceResponse,
  DeviceStatus,
} from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import mongoose from "mongoose";

export const createDevice = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId!);
    const dto: DeviceCreateDTO = req.body;

    await DeviceService.validateDeviceLimit(userId.toString());

    const device = await DeviceService.createDevice({
      ...dto,
      UserId: userId,
      status: DeviceStatus.ACTIVE,
    });

    Logger.info(`Device created: ${device._id}`);
    res.status(201).json({
      status: "success",
      data: mapToDeviceResponse(device),
    });
  } catch (error) {
    Logger.error(`Device creation failed: ${error}`);
    throw new BadRequestError("Device creation failed");
  }
};

const mapToDeviceResponse = (device: any): DeviceResponse => ({
  id: device._id.toString(),
  name: device.name,
  IMIE1: device.IMIE1,
  IMEI2: device.IMEI2 || undefined,
  SN: device.SN,
  Type: device.Type,
  status: device.status,
  userId: device.UserId._id?.toString() || device.UserId.toString(),
  createdAt: device.createdAt,
  updatedAt: device.updatedAt,
  user: {
    id: device.UserId._id?.toString() || device.UserId.toString(),
    username: device.UserId.username || "Unknown",
    email: device.UserId.email || "Unknown",
  },
});
