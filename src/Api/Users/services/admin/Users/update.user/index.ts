import { User } from "@/Api/Users/model/users";
import { Device } from "@/Api/Device/models";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import { CreateUserDTO } from "@/Api/Users/interfaces/user.dto";

export const updateUser = async (
  req: Request<{ id: string }, {}, Partial<CreateUserDTO>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.email) {
      const emailExist = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });
      if (emailExist) throw new BadRequestError("Email already in use");
    }

    if (updateData.phoneNumber) {
      const phoneExist = await User.findOne({
        phoneNumber: updateData.phoneNumber,
        _id: { $ne: id },
      });
      if (phoneExist) throw new BadRequestError("Phone number already in use");
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    if (!updatedUser) {
      throw new BadRequestError("User not found");
    }
    const devicesCount = await Device.countDocuments({ user: id });
    const formattedUser = {
      ...updatedUser,
      role: updatedUser.role.toString(),
      devices: devicesCount,
      subActiveTill: updatedUser.subActive ? updatedUser.subActiveTill : null,
      subscriptionStatus: updatedUser.subActive ? "Active" : "Inactive",
    };

    logger.info(`Updated user ${id}`);
    res.status(200).json({
      status: "success",
      data: formattedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    throw new BadRequestError(`Error updating user: ${error}`);
  }
};
