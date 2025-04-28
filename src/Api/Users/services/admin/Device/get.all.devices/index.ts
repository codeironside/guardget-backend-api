import { Device } from "@/Api/Device/models";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { PipelineStage } from "mongoose";

export const getAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const aggregationPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "UserId",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                phoneNumber: 1,
                imageurl:1,
                subscriptionStatus: {
                  $cond: {
                    if: "$subActive",
                    then: "Active",
                    else: "Inactive",
                  },
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
          name: 1,
          IMIE1: 1,
          SN: 1,
          Type: 1,
          status: 1,
          createdAt: 1,
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
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ];

    const result = await Device.aggregate(aggregationPipeline);
    const devices = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    logger.info("Fetched paginated devices");
    res.status(200).json({
      status: "success",
      data: devices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching devices: ${error}`);
    throw new BadRequestError(`Error fetching devices: ${error}`);
  }
};
