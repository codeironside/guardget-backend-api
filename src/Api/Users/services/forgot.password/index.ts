import { Response, Request } from "express";
import { User } from "../../model/users";
import { BadRequestError } from "@/core/error";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import { smsService } from "@/core/services/sms";
import logger from "@/core/logger";

import bcrypt from "bcrypt";
import { storeTempPasswordResetData , generatePasswordResetToken } from "@/core/services/store.forget.password.details";

interface Email {
  phonenumber: string;
  password: string;
}

export const forgetPassword = async (
  req: Request<{}, {}, Email>,
  res: Response
): Promise<void> => {
  try {
    const { phonenumber, password } = req.body;
    if (!phonenumber || !password) {
      throw new BadRequestError("Phonenumber and password are required");
    }

    const userExist = await User.findOne({ phoneNumber: phonenumber });
    if (!userExist) throw new BadRequestError("User not found");

    const otp = await OTPGenerator.generate();
    const text = `Your password reset code for Guardget is ${otp}. Please ignore if you didn't request this.`;

    const sent = await smsService.sendMessage({
      to: userExist.keyholderPhone1,
      text,
    });
    if (!sent) throw new BadRequestError("Failed to send OTP");

    const resetToken = generatePasswordResetToken();
    const hashedPassword = await bcrypt.hash(password, 10);

    const tempData = {
      otp,
      userId: userExist._id!.toString(),
      password: hashedPassword,
      changepassword: true,
    };

    await storeTempPasswordResetData(resetToken, tempData);

    logger.info(`Password reset initiated for ${userExist.keyholderPhone1}`);
    res.status(201).json({
      status: "success",
      message: "OTP sent to your keyholder; check their phone",
      resetToken,
    });
  } catch (error) {
    logger.error(`Password reset error: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "Password reset failed"
    );
  }
};
