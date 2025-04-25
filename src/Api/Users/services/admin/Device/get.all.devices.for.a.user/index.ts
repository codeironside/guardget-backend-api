import { Device } from "@/Api/Device/models";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { User } from "@/Api/Users/model/users";
import mongoose from "mongoose";

export const getUserDevices = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    const devices = await Device.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                subscriptionStatus: {
                  $cond: ["$subActive", "Active", "Inactive"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          deviceId: 1,
          status: 1,
          createdAt: 1,
          lastActive: 1,
          user: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    logger.info(`Fetched devices for user ${userId}`);
    res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
        devices,
      },
    });
  } catch (error) {
    logger.error(`Error fetching user devices: ${error}`);
    throw new BadRequestError(`Error fetching user devices: ${error}`);
  }
};
