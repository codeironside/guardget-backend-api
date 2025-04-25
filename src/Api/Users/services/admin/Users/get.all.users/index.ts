import { Request, Response } from "express";
import { User } from "@/Api/Users/model/users";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "devices",
          localField: "_id",
          foreignField: "user",
          as: "devices",
        },
      },
      {
        $addFields: {
          devices: { $size: "$devices" },
          role: { $toString: "$role" },
          subActiveTill: {
            $cond: ["$subActive", "$subActiveTill", null],
          },
          subscriptionStatus: {
            $cond: ["$subActive", "Active", "Inactive"],
          },
        },
      },
      { $project: { password: 0 } },
    ]);

    logger.info("Retrieved all users");
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error}`);
    throw new BadRequestError(`Error fetching users: ${error}`);
  }
};