import { Request, Response } from "express";
import { BadRequestError } from "@/core/error";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import { redisClient } from "@/core/utils/redis"; // Updated Redis client
import {smsService }from "@/core/services/sms";
import jwt from "jsonwebtoken";
import { config } from "@/core/utils/config";
import Logger from "@/core/logger";

interface RegistrationTokenPayload {
  tempId: string;
}

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  let registrationToken: string | undefined;

  try {
    registrationToken = req.body.registrationToken;

    if (!registrationToken) {
      throw new BadRequestError("Missing registration token");
    }

    // Verify JWT
    const decoded = jwt.verify(
      registrationToken,
      config.JWT_SECRET
    ) as RegistrationTokenPayload;

    // Get Redis key
    const redisKey = `temp:user:${decoded.tempId}`;

    // Get existing data using the correct client method
    const tempData = await redisClient.getClient().get(redisKey);

    if (!tempData) {
      throw new BadRequestError(
        "Session expired. Please start registration again."
      );
    }

    const userData = JSON.parse(tempData);

    // Generate new OTP
    const newOtp = await OTPGenerator.generate();

    // Update Redis data with correct method
    const updatedData = {
      ...userData,
      otp: newOtp,
      createdAt: Date.now(),
    };

    await redisClient
      .getClient()
      .setEx(redisKey, 900, JSON.stringify(updatedData));

    // Resend SMS
    const text = `Your new Guardget confirmation code is ${newOtp}. Please don't share it with anyone else`;
    const sent = await smsService.sendMessage({
      to: updatedData.phoneNumber,
      text,
    });

    if (!sent) {
      throw new BadRequestError("Failed to resend OTP");
    }

    Logger.warn(`OTP resent to ${updatedData.phoneNumber}`);

    res.status(200).json({
      status: "success",
      message: "New OTP sent; check your phone",
      registrationToken,
    });
  } catch (err) {
    Logger.error("Error resending OTP:");

    // Cleanup on error
    if (registrationToken) {
      try {
        const decoded = jwt.verify(
          registrationToken,
          config.JWT_SECRET
        ) as RegistrationTokenPayload;
        await redisClient.getClient().del(`temp:user:${decoded.tempId}`);
      } catch (cleanupErr) {
        Logger.error("Cleanup failed:");
      }
    }

    throw new BadRequestError(
      err instanceof Error ? err.message : "Error resending OTP"
    );
  }
};
