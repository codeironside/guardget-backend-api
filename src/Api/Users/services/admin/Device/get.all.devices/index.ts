import { Device } from "@/Api/Device/models";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import logger from "@/core/logger";

export const getAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const devices = await Device.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                phoneNumber: 1,
                subscriptionStatus: {
                  $cond: ["$subActive", "Active", "Inactive"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          deviceId: 1,
          status: 1,
          createdAt: 1,
          lastActive: 1,
          user: {
            $ifNull: [
              "$userDetails",
              {
                username: "Unknown",
                email: "Unknown",
                phoneNumber: "Unknown",
                subscriptionStatus: "Inactive",
              },
            ],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    logger.info("Fetched all devices");
    res.status(200).json({
      status: "success",
      data: devices,
    });
  } catch (error) {
    logger.error(`Error fetching devices: ${error}`);
    throw new BadRequestError(`Error fetching devices: ${error}`);
  }
};
