
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "@/core/utils/config";
import { redisClient } from "@/core/utils/redis";
import logger from "@/core/logger";

interface RegistrationTokenPayload {
  tempId: string;
  iat: number;
}

// Add interface for temporary user data
interface TemptransferDeviceValidation {
  otp: string;
  phonenumber: string;
}

export const generateRegistrationToken = (): string => {
  const tempId = uuidv4();
  return jwt.sign({ tempId }, config.JWT_SECRET, { expiresIn: "15m" });
};

export const storeTempTransferValidationOtp= async (
  token: string,
  userData: TemptransferDeviceValidation
): Promise<void> => {
  try {
    // Ensure Redis connection
    if (!redisClient.getClient().isOpen) {
      await redisClient.connect();
    }

    const decoded = jwt.verify(
      token,
      config.JWT_SECRET
    ) as RegistrationTokenPayload;

    await redisClient.getClient().setEx(
      `temp:user:${decoded.tempId}`,
      900, // 15 minutes
      JSON.stringify(userData)
    );

    logger.debug(`Stored temporary data for ${decoded.tempId}`);
  } catch (error) {
    console.log(`error: ${error}`);
    logger.error("Error storing temporary user data:");
    throw new Error("Failed to store temporary user data");
  }
};

// export const verifyTempUserOtp = async (
//   token: string
// ): Promise<TemptransferDeviceValidation | null> => {
//   try {
//     // Ensure Redis connection
//     if (!redisClient.getClient().isOpen) {
//       await redisClient.connect();
//     }

//     const decoded = jwt.verify(
//       token,
//       config.JWT_SECRET
//     ) as RegistrationTokenPayload;
//     const data = await redisClient
//       .getClient()
//       .get(`temp:user:${decoded.tempId}`);

//     if (!data) {
//       logger.warn(`No temporary data found for ${decoded.tempId}`);
//       return null;
//     }

//     logger.debug(`Retrieved temporary data for ${decoded.tempId}`);
//     return JSON.parse(data) as TemptransferDeviceValidation ;
//   } catch (error) {
//     logger.error("Error retrieving temporary user data:");
//     throw new Error("Failed to retrieve temporary user data");
//   }
// };
