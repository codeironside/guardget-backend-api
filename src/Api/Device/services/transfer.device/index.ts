import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { DeviceCreateDTO, DeviceResponse } from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import Logger from "@/core/logger";
import { z } from "zod";



const TransferSchema = z.object({
  imei: z.string().length(15),
  sn: z.string().min(5),
  newUserEmail: z.string().email(),
});

export const transferDevice = async (req: Request, res: Response) => {
  try {
    const { imei, sn, newUserEmail } = TransferSchema.parse(req.body);
    const currentUserId = req.userId!;

    const device = await DeviceService.transferDeviceByDetails(
      imei,
      sn,
      currentUserId,
      newUserEmail
    );

    Logger.info(`Device transferred: ${imei}`);
    res.json({
      status: "success",
      data: {
        deviceId: device._id,
        newOwner: device.UserId,
        status: device.status,
      },
    });
  } catch (error) {
    Logger.error(`Transfer failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "Device transfer failed"
    );
  }
};
