import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import { Response, Request } from "express";
import { redisClient } from "@/core/utils/redis";
import jwt from "jsonwebtoken";
import { config } from "@/core/utils/config";
import bcrypt from "bcrypt";
import Logger from "@/core/logger";

interface RegistrationTokenPayload {
  tempId: string;
}

export const validateDeviceTransferOtp = async (
  req: Request<{}, {}, { otp: string; registrationToken: string }>,
  res: Response
): Promise<void> => {
  let tempId: string | null = null;

  try {
    const { otp, registrationToken } = req.body;

    if (!otp || !registrationToken) {
      throw new BadRequestError("OTP and registration token are required");
    }

    // Verify JWT
    const decoded = jwt.verify(
      registrationToken,
      config.JWT_SECRET
    ) as RegistrationTokenPayload;
    tempId = decoded.tempId;
    const redisKey = `temp:user:${tempId}`;

    const tempData = await redisClient.getClient().get(redisKey);

    if (!tempData) {
      throw new BadRequestError(
        "Session expired. Please start proocess again again."
      );
    }

    const userData = JSON.parse(tempData);

    if (userData.otp !== otp) {
      throw new BadRequestError("Invalid OTP");
    }

    await await redisClient.getClient().del(redisKey);
    const datetransferrred = new Date();
    Logger.info(`tranfer validate ${datetransferrred}`);

    res.status(200).json({
      status: "success",
      message: "User created successfully",
    });
  } catch (err) {
    Logger.error(`Error validating OTP:${err}`);
    if (tempId) {
      try {
        await redisClient.getClient().del(`temp:user:${tempId}`);
      } catch (cleanupErr) {
        Logger.error("Cleanup failed:");
      }
    }

    throw new BadRequestError(
      err instanceof Error ? err.message : "Error validating OTP"
    );
  }
};
