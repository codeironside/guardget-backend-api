import { Request, Response } from "express";
import { User } from "../../model/users";
import { BadRequestError } from "@/core/error";
import { getTempPasswordResetData } from "@/core/services/store.forget.password.details";
import jwt from "jsonwebtoken";
import { config } from "@/core/utils/config";
import { redisClient } from "@/core/utils/redis";
import logger from "@/core/logger";

interface VerifyResetOTPPayload {
  token: string;
  otp: string;
}

interface PasswordtokenPayload {
  tempId: string;
  iat: number;
}

export const verifyResetOTP = async (
  req: Request<{}, {}, VerifyResetOTPPayload>,
  res: Response
): Promise<void> => {
  try {
    console.log(`reset password token ${JSON.stringify(req.body)}`);
    const { token, otp } = req.body;
    const rtoken = otp;
    const rotp = token;
    if (!rtoken || !rotp) {
      throw new BadRequestError("Reset token and OTP are required");
    }
    const tempData = await getTempPasswordResetData(rtoken);
    if (!tempData) {
      throw new BadRequestError("Invalid or expired reset token");
    }
    if (tempData.otp !== rotp) {
      throw new BadRequestError("Invalid OTP provided");
    }
    const user = await User.findById(tempData.userId);
    if (!user) {
      throw new BadRequestError("User no longer exists");
    }
    user.password = tempData.hashedPassword;
    await user.save();
    const decoded = jwt.verify(
      rtoken,
      config.JWT_SECRET
    ) as PasswordtokenPayload;

    await redisClient.getClient().del(`temp:password-reset:${decoded.tempId}`);

    logger.info(`Password updated for user ${tempData.userId}`);
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.error(`OTP verification failed: ${error}`);
    if (req.session) {
      req.session.destroy(() => {});
    }

    throw new BadRequestError(
      error instanceof Error ? error.message : "Password reset failed"
    );
  }
};
