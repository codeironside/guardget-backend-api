import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../model/users";
import { Roles } from "../../model/roles/role";
import { CreateUserDTO, OTP } from "../../interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";
import SMSService from "@/core/services/sms";
import { BadRequestError } from "@/core/error";

export const createUser = async (
  req: Request<{}, {}, CreateUserDTO>,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      firstName,
      middleName,
      surName,
      role,
      country,
      stateOfOrigin,
      phoneNumber,
      address,
      email,
      password,
      keyholder,
    } = req.body;

    const roleDoc = await Roles.findOne({name:role });
    if (!roleDoc) throw new BadRequestError("Invalid role");

    const conflict = await User.findOne({
      $or: [{ email }, { phoneNumber }, { username }],
    });
    if (conflict) throw new BadRequestError("User already exists");

    const otp = await OTPGenerator.generate();
    const text = `Your Guardget confirmation code is ${otp}. Please don't share it with anyone else`;

    const sent = await SMSService.sendMessage({ to: phoneNumber, text });
    if (!sent) throw new BadRequestError("Failed to send OTP");

    req.session.user = {
      otpCode: otp,
      _id: null,
      username,
      firstName,
      middleName,
      surName,
      role: roleDoc._id,
      country,
      stateOfOrigin,
      phoneNumber,
      address,
      email,
      password,
      keyholder,
      changepassword: false,
    };

    Logger.warn(`OTP sent to ${email}, user creation paused for verification`);
    res
      .status(201)
      .json({ status: "success", message: "OTP sent; check your phone" });
  } catch (err) {
    Logger.error("Error creating user");
    req.session.destroy(() => {});
    throw new BadRequestError(
      err instanceof Error ? err.message : "Error creating user"
    );
  }
};
