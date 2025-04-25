import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import { Response, Request } from "express";
import { OTP } from "../../interfaces/user.dto";
import bcrypt from "bcrypt";
import logger from "@/core/logger";


export const validateOtp = async (
  req: Request<{}, {}, OTP>,
  res: Response
): Promise<void> => {
  try {
    const { otp } = req.body;
    if (!otp && otp.length < 8) {
      throw new BadRequestError("OTP is required");
    }
    if (req.session.user?.otpCode !== otp) {
      throw new BadRequestError("Invalid OTP");
    }
    req.session.user.otpCode = null;
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
    } = req.session.user;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hash(password!, salt);
      if(!req.session.user.changepassword){  const createUser = await User.create({
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
        password: hashedPassword,
        emailVerified: true,
      });
      if (!createUser) {
        throw new BadRequestError("Error creating user");
      }
      logger.info(
        `successfully created and validate user with email: ${email}`
      );
      res.status(200).json({
        status: "success",
        message: "User created successfully",
      });
      } else {
        const changedpassword = await User.findByIdAndUpdate(
          req.session.user._id,
          { password: hashedPassword },
          { new: true }
        );
        if (!changedpassword) {
          throw new BadRequestError("Error changing password");
        }
        logger.info(
          `successfully changed password for user with email: ${email}`
        );
        res.status(200).json({
          status: "success",
          message: "Password changed successfully",
        });
      }
  
  } catch (error) {
    throw new BadRequestError("Error validating OTP");
  }
};
