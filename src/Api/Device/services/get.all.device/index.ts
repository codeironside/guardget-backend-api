import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { DeviceResponse } from "../../interface";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";

export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const devices = await DeviceService.getUserDevices(userId.toString());

    res.json({
      status: "success",
      data: devices.map(mapToDeviceResponse),
    });
  } catch (error) {
    Logger.error(`Device retrieval failed: ${error}`);
    throw new BadRequestError("Failed to get devices");
  }
};

/**
 * Maps the device object to a more user-friendly response format.
 * @param {any} device - The device object to map.
 * @returns {DeviceResponse} - The mapped device response.
 */

const mapToDeviceResponse = (device: any) => ({
  id: device._id,
  name: device.name,
  IMIE1: device.IMIE1,
  IMEI2: device.IMEI2,
  serialNumber: device.serialNumber,
  Type: device.Type,
  status: device.status,
  purchaseDate:device.purchaseDate,
  user: {
    id: device.UserId._id,
    username: device.UserId.username,
    email: device.UserId.email,
  },
  createdAt: device.createdAt,
});
