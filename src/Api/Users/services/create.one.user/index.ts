import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../model/users";
import { Roles } from "../../model/roles/role";
import { CreateUserDTO, OTP } from "../../interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";
import { smsService } from "@/core/services/sms";
import { BadRequestError } from "@/core/error";
import { generateRegistrationToken } from "@/core/services/storetemporarysignup";
import { storeTempUserData } from "@/core/services/storetemporarysignup";

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
      email,
      password,
      keyholderPhone1,
      keyholderPhone2
    } = req.body;

    const roleDoc = await Roles.findOne({ name: role });
    if (!roleDoc) throw new BadRequestError("Invalid role");

    const conflict = await User.findOne({
      $or: [{ email }, { phoneNumber }, { username }],
    });
    if (conflict) throw new BadRequestError("User already exists");

    const otp = await OTPGenerator.generate();
    const text = `Your Guardget confirmation code is ${otp}. Please don't share it with anyone else`;

    const sent = await smsService.sendMessage({ to: phoneNumber, text });
    if (!sent) throw new BadRequestError("Failed to send OTP");

    const registrationToken = generateRegistrationToken();

    const tempUserData = {
      otp,
      username,
      firstName,
      middleName,
      surName,
      role: roleDoc._id.toString(),
      country,
      stateOfOrigin,
      phoneNumber,
      email,
      password: await bcrypt.hash(password, 10),
      keyholderPhone1,
      keyholderPhone2,
      changepassword: false,
    };
    await storeTempUserData(registrationToken, tempUserData);
    console.log(`req session user ${JSON.stringify(registrationToken)}`);
    Logger.warn(`OTP sent to ${email}, user creation paused for verification`);
    res.status(201).json({
      status: "success",
      message: "OTP sent; check your phone",
      registrationToken,
    });
  } catch (err) {
    console.log(`err ${err}`)
    Logger.error("Error creating user");
    req.session.destroy(() => {});
    throw new BadRequestError(
      err instanceof Error ? err.message : "Error creating user"
    );
  }
};
