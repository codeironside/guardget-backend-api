import { Request, Response } from "express";
import { User } from "@/Api/Users/model/users";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

export const toggleUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status);
    if (!id) {
      throw new BadRequestError("User ID is required");
    }

    if (typeof status !== "boolean") {
      throw new BadRequestError("Status must be a boolean value");
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { Deactivated: status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw new BadRequestError("User not found");
    }

    const action = status ? "deactivated" : "activated";
    logger.info(`User ${action}: ${updatedUser.email}`);

    res.status(200).json({
      status: "success",
      message: `User account ${action}`,
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error(`Error updating user status: ${error.message}`);

    if (error instanceof BadRequestError) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
};
