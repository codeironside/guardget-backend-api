import { Device } from "@/Api/Device/models";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { User } from "@/Api/Users/model/users";
import mongoose from "mongoose";
export const getOneUserDevice = async (
  req: Request<{ userId: string; deviceId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId, deviceId } = req.params;
    const user = await User.findById(userId).select("username email subActive");
    if (!user) {
      throw new BadRequestError("User not found");
    }

    const device = await Device.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(deviceId),
          UserId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "UserId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                imageurl:1,
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
          metadata: 1,
          user: 1,
        },
      },
    ]);

    if (device.length === 0) {
      throw new BadRequestError(
        "Device not found or not associated with this user"
      );
    }

    logger.info(`Fetched device ${deviceId} for user ${userId}`);
    res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          subscriptionStatus: user.subActive ? "Active" : "Inactive",
        },
        device: device[0],
      },
    });
  } catch (error) {
    logger.error(`Error fetching device: ${error}`);
    throw new BadRequestError(`Error fetching device: ${error}`);
  }
};