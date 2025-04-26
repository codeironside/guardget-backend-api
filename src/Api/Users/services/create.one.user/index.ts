import { Request, Response } from "express";
import { User } from "../../model/users";
import { CreateUserDTO } from "../../interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";
import WhatsAppService from "@/core/services/whatsapp";
import { Roles } from "../../model/roles/role";
import { BadRequestError } from "@/core/error/";

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

    const roles = await Roles.findOne({
      role,
    });
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }, { username }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }
    const otp = await OTPGenerator.generate();
    const text = `welcome to guarget, this your OTP code ${otp}, please use it to verify your account, and do not disclose it.`;

    const sentOTp = await WhatsAppService.sendMessage({
      to: phoneNumber,
      text,
    });
    if (sentOTp) {
      console.log(`OTP sent successfully: ${JSON.stringify(sentOTp)}`);
      req.session.user = {
        otpCode: otp,
        username,
        firstName,
        middleName,
        surName,
        role: roles?._id,
        country,
        stateOfOrigin,
        phoneNumber,
        address,
        email,
        password,
      };

      Logger.warn(
        `instantiated a user with ${email} not verified creation process`
      );
      res.status(201).json({
        status: "success",
        message: "otp sent please check your phone",
        data: otp,
      });
    } else {
      console.warn(`issues sending OTP: ${sentOTp}`);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });
    throw new BadRequestError(`Error creating user: ${error}`);
  }
};
