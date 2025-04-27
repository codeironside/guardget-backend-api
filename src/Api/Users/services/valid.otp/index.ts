import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import { Response, Request } from "express";
import { OTP } from "../../interfaces/user.dto";
import bcrypt from "bcrypt";
import logger from "@/core/logger";
import { day } from "@/core/utils/types/global";

export const validateOtp = async (
  req: Request<{}, {}, OTP>,
  res: Response
): Promise<void> => {
  try {
    const { otp } = req.body;
    if (typeof otp !== "string" || otp.length < 1)
      throw new BadRequestError("OTP is required");

    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.otpCode !== otp)
      throw new BadRequestError("Invalid OTP, or session expired try again");

    sessionUser.otpCode = null;
    const {
      _id,
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
      changepassword,
      keyholder,
    } = sessionUser;

    const hashed = await bcrypt.hash(password!, 10);

    if (!changepassword) {
      const newUser = await User.create({
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
        keyholder,
        password: hashed,
        emailVerified: true,
      });
      if (!newUser) throw new BadRequestError("Error creating user");
      logger.info(`Created user ${email}`);
      res
        .status(200)
        .json({ status: "success", message: "User created successfully" });
    } else {
      if (!_id)
        throw new BadRequestError(
          "Session missing user ID for password change"
        );
      const updated = await User.findByIdAndUpdate(
        _id,
        { password: hashed },
        { new: true }
      );
      if (!updated) throw new BadRequestError("Error changing password");
      logger.info(`Changed password for ${email}: user verified at ${day}`);
      res
        .status(200)
        .json({ status: "success", message: "Password changed successfully" });
    }
    req.session.destroy((e) => {
      if (e) throw new BadRequestError("Error destroying session");
    });
  } catch (err) {
    req.session.destroy((e) => {
      if (e) throw new BadRequestError("Error destroying session");
    });
    logger.error("Error validating OTP:");
    throw new BadRequestError(
      err instanceof Error ? err.message : "Error validating OTP"
    );
  }
};
