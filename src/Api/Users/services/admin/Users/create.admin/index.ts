import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "@/Api/Users/model/users";
import { Roles } from "@/Api/Users/model/roles/role";
import { CreateUserDTO, OTP } from "@/Api/Users/interfaces/user.dto";
import { OTPGenerator } from "@/core/utils/otpGenerator";
import Logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

export const createAdmin = async (
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

    const roleDoc = await Roles.findOne({ name: role });
    if (!roleDoc) throw new BadRequestError("Invalid role");

    const conflict = await User.findOne({
      $or: [{ email }, { phoneNumber }, { username }],
    });
    if (conflict) throw new BadRequestError("User already exists");

    const hashed = await bcrypt.hash(password!, 10);
    const newUser = await User.create({
      username,
      firstName,
      middleName,
      surName,
      role:roleDoc._id,
      country,
      stateOfOrigin,
      phoneNumber,
      address,
      email,
      keyholder,
      password: hashed,
      emailVerified: true,
    });
    const created = await User.findById(newUser._id).select("-password").populate("role","name").lean()
    if(!newUser) throw new BadRequestError(`error creating user `)
    res
      .status(201)
      .json({ status: "success", message: "admin created successfully", data:created });
  } catch (err) {
    Logger.error("Error creating user");
    req.session.destroy(() => {});
    throw new BadRequestError(
      err instanceof Error ? err.message : "Error creating user"
    );
  }
};
