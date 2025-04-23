import { Request, Response } from "express";
import { User } from "../../model";
import { CreateUserDTO } from "../../interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";

export const createUser = async (
  req: Request<CreateUserDTO>,
  res: Response
) => {
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
    } = req.body;

    const newUser = new User({
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
    });
    const otp = OTPGenerator.generate();
    req.session.user = {
      otpCode: otp,
      _id: newUser._id,
    };
    await newUser.save();
    Logger.warn(`instantiated a user with ${email} creation process`);
    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: otp,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error,
    });
  }
};
