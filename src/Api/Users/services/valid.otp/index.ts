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

export const validateOtp = async (
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

    // Get temp data
    const tempData = await redisClient.getClient().get(redisKey);

    if (!tempData) {
      throw new BadRequestError(
        "Session expired. Please start registration again."
      );
    }

    const userData = JSON.parse(tempData);

    // Validate OTP
    if (userData.otp !== otp) {
      throw new BadRequestError("Invalid OTP");
    }


    const newUser = await User.create({
      username: userData.username,
      firstName: userData.firstName,
      middleName: userData.middleName,
      surName: userData.surName,
      role: userData.role,
      country: userData.country,
      stateOfOrigin: userData.stateOfOrigin,
      phoneNumber: userData.phoneNumber,
      keyholderPhone1: userData.keyholderPhone1,
      keyholderPhone2: userData.keyholderPhone2,
      email: userData.email,
      password: userData.password, // Already hashed
      keyholder: userData.keyholder,
      emailVerified: true,
    });

    await await redisClient.getClient().del(redisKey);

    Logger.info(`User created: ${newUser.email}`);

    res.status(200).json({
      status: "success",
      message: "User created successfully",
      userId: newUser._id,
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
