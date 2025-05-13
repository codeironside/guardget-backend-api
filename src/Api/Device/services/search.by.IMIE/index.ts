import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { Device } from "../../models";
import { DeviceCreateDTO, DeviceResponse } from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import { z } from "zod";

// const IMEISchema = z.object({
//   qparams: z.string().length(6, "IMEI must be 6 characters"),
// });

export const searchByIMEI = async (req: Request, res: Response) => {
  try {
    const { qparams } = req.query;
    const userId = req.userId;

    const device = await Device.findOne({
      $or: [{ IMIE1: qparams}, { IMEI2: qparams }, {SN:qparams}],
    }).populate("UserId", "username email phoneNumber");

    if (!device) {
      throw new BadRequestError("Device not found");
    }

    Logger.info(`IMEI search: ${qparams}`);
    res.json({
      status: "success",
      data: {
        ...mapDeviceResponse(device),

      },
    });
  } catch (error) {
    Logger.error(`IMEI search failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "Device search failed"
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
  location:device.location,
  user: {
    id: device.UserId._id,
    username: device.UserId.username,
    email: device.UserId.email,
  },
  updatedAt: device.updatedAt,
});