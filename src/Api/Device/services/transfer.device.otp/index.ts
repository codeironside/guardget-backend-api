import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../../Users/model/users";
import { Roles } from "../../../Users/model/roles/role";
import { CreateUserDTO, OTP } from "../../../Users/interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";
import { smsService } from "@/core/services/sms";
import { BadRequestError } from "@/core/error";
import { generateRegistrationToken } from "@/core/services/storetemporarysignup";
import { storeTempTransferValidationOtp } from "@/core/services/storeDevice.transfer.validation";
import mongoose from "mongoose";

export const TransferDeviceOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }
    const findUsers = await User.findById(userId);
    if (!findUsers) {
      throw new BadRequestError("User not found");
    }

    // Generate OTP
    const otp = await OTPGenerator.generate();
    const text = `Your Guardget confirmation code is ${otp}. Please don't share it with anyone else`;

    // Send OTP via SMS
    const sent = await smsService.sendMessage({
      to: findUsers.phoneNumber,
      text,
    });
    if (!sent) {
      throw new BadRequestError("Failed to send OTP");
    }

    // Generate registration token
    const registrationToken = generateRegistrationToken();

    // Prepare data for temporary transfer validation
    const TemptransferDeviceValidation = {
      otp,
      phonenumber: findUsers.phoneNumber,
    };

    // Store temporary transfer validation OTP
    await storeTempTransferValidationOtp(
      registrationToken,
      TemptransferDeviceValidation
    );

    // Log the registration token
    console.log(`req session user ${JSON.stringify(registrationToken)}`);

    // Respond to the client
    res.status(201).json({
      status: "success",
      message: "OTP sent; check your phone",
      registrationToken,
    });
  } catch (err) {
    console.error("Error creating user", err);
    req.session.destroy(() => {});
    throw new BadRequestError(
      err instanceof Error ? err.message : "Error creating user"
    );
  }
};