import { Request, Response } from "express";
import { DeviceService } from "@/core/services/deviceService";
import { DeviceCreateDTO, DeviceResponse } from "@/Api/Device/interface";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import Logger from "@/core/logger";
import { z } from "zod";
import { User } from "@/Api/Users/model/users";
const TransferSchema = z.object({
  deviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: "Invalid MongoDB ID format",
  }),
  recipientEmail: z.string().email().toLowerCase(),
  reason:z.string().min(1)

});
export const transferDevice = async (req: Request, res: Response) => {
  try {
    console.log(`req.body ${JSON.stringify(req.body)}`)
    const {deviceId, recipientEmail,reason } = TransferSchema.parse(req.body);
    const currentUserId = req.userId!;
const newuseremail = recipientEmail
    const device = await DeviceService.transferDeviceByDetails(
      deviceId,
      currentUserId,
      newuseremail,
      reason
    );
    const user = await User.findOne({email:newuseremail})
      .select("firstName middleName surName email phoneNumber")
      .lean();
    Logger.info(`Device transferred: ${deviceId} to ${user!.email}`);
    
    res.json({
      status: "success",
      message:`Transfer successful to ${user!.firstName}`,
      data: {
        deviceId: device._id,
        newOwnername: user,
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
