import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { Device } from "../../models";
import { DeviceCreateDTO, DeviceResponse } from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import mongoose from "mongoose";
import { z } from "zod";

export const getDevice = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId!);


    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      throw new BadRequestError("Invalid device ID");
    }
    const device = await Device.findById(deviceId).populate(
      "UserId",
      "username email phoneNumber"
    );

    if (!device) {
      throw new BadRequestError(
       "Device not found or unauthorized"
      );
    }
      if (device.UserId === userId) {
        throw new BadRequestError("Unauthorized access");
       }

    Logger.info(`Device retrieved: ${deviceId}`);
    res.json({
      status: "success",
      data: mapDeviceResponse(device),
    });
  } catch (error) {
    Logger.error(`Device retrieval failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "Failed to get device"
    );
  }
};

const mapDeviceResponse = (device: any) => ({
  id: device._id,
  name: device.name,
  IMIE1: device.IMIE1,
  IMEI2: device.IMEI2,
  SN: device.SN,
  Type: device.Type,
  status: device.status,
  user: {
    id: device.UserId._id,
    username: device.UserId.username,
    email: device.UserId.email,
  },
  createdAt: device.createdAt,
});
