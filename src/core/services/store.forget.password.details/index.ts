import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "@/core/utils/config";
import { redisClient } from "@/core/utils/redis";
import logger from "@/core/logger";
import bcrypt from "bcrypt";

interface PasswordResetTokenPayload {
  tempId: string;
  iat: number;
}

interface TempPasswordResetData {
  otp: string;
  userId: string;
  hashedPassword: string;
}

export const generatePasswordResetToken = (): string => {
  const tempId = uuidv4();
  return jwt.sign({ tempId }, config.JWT_SECRET, { expiresIn: "15m" });
};

export const storeTempPasswordResetData = async (
  token: string,
  userData: Omit<TempPasswordResetData, "hashedPassword"> & { password: string }
): Promise<void> => {
  try {
    // Ensure Redis connection
    if (!redisClient.getClient().isOpen) {
      await redisClient.connect();
    }
        console.log(`users data ${JSON.stringify(userData)}`);
    const decoded = jwt.verify(
      token,
      config.JWT_SECRET
    ) as PasswordResetTokenPayload;

    const storageData: TempPasswordResetData = {
      otp: userData.otp,
      userId: userData.userId,
      hashedPassword:userData.password,
    };

    await redisClient.getClient().setEx(
      `temp:password-reset:${decoded.tempId}`,
      900, // 15 minutes expiration
      JSON.stringify(storageData)
    );

    logger.debug(`Stored password reset data for user ${userData.userId}`);
  } catch (error) {
    logger.error(`Error storing password reset data:${error}`);
    throw new Error("Failed to store password reset data");
  }
};

// Utility function to retrieve password reset data
export const getTempPasswordResetData = async (
  token: string
): Promise<TempPasswordResetData | null> => {
  try {
    const decoded = jwt.verify(
      token,
      config.JWT_SECRET
    ) as PasswordResetTokenPayload;

    const data = await redisClient
      .getClient()
      .get(`temp:password-reset:${decoded.tempId}`);

    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Error storing password reset data:${error}`);
    return null;
  }
};
