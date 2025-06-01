import { DeviceStatus } from "@/Api/Device/models";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { PipelineStage } from "mongoose";
import { TransferredDeviceModel } from "@/Api/Device/models/transfer_history";

export const transferedDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || "all";

    const matchStage: Record<string, any> = {};
    if (statusFilter !== "all") {
      matchStage.requestStatus = statusFilter;
    }

    const aggregationPipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "fromID",
          foreignField: "_id",
          as: "fromUser",
          pipeline: [{ $project: { username: 1, email: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "toID",
          foreignField: "_id",
          as: "toUser",
          pipeline: [{ $project: { username: 1, email: 1 } }],
        },
      },
      { $unwind: { path: "$fromUser", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$toUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          deviceId: "$_id",
          deviceName: "$name",
          fromUser: {
            _id: "$fromUser._id",
            username: "$fromUser.username",
            email: "$fromUser.email",
          },
          toUser: {
            _id: "$toUser._id",
            username: "$toUser.username",
            email: "$toUser.email",
          },
          reason: 1,
          status: "$requestStatus",
          createdAt: 1,
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

    const result = await TransferredDeviceModel.aggregate(aggregationPipeline);
    const transfers = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    logger.info(`Fetched ${transfers.length} transfer requests`);
    res.status(200).json({
      status: "success",
      data: transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching transfer requests: ${error}`);
    throw new BadRequestError(`Error fetching transfer requests: ${error}`);
  }
};
