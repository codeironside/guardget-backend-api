import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { DeviceStatusUpdateDto } from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";

export const updateDeviceStatus = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const dto: DeviceStatusUpdateDto = req.body;
    const userId = req.userId!;

    const device = await DeviceService.updateDeviceStatus(
      deviceId,
      userId.toString(),
      dto.status,
      dto.location,
      dto.description
    );

    Logger.info(`Device status updated: ${deviceId}`);
    res.json({
      status: "success",
      data: mapDeviceResponse(device),
    });
  } catch (error) {
    Logger.error(`Status update failed: ${error}`);
    throw new BadRequestError("Failed to update device status");
  }
};
const mapDeviceResponse = (device: any) => ({
  id: device._id,
  name: device.name,
  IMIE1: device.IMIE1,
  IMEI2: device.IMEI2,
  serialNumber: device.serialNumber,
  Type: device.Type,
  status: device.status,
  user: {
    id: device.UserId._id,
    username: device.UserId.username,
    email: device.UserId.email,
  },
  createdAt: device.createdAt,
});
