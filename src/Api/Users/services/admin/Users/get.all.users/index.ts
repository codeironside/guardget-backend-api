import { Request, Response } from "express";
import { User } from "@/Api/Users/model/users";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const aggregationPipeline = [
      // Lookup for role name
      {
        $lookup: {
          from: "roles", // Ensure this matches your roles collection name
          localField: "role",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } },
      // Device lookup
      {
        $lookup: {
          from: "devices", // Ensure this matches your devices collection name
          localField: "_id",
          foreignField: "UserId", // Match the field name in your Device model
          as: "devices",
        },
      },
      // Add calculated fields
      {
        $addFields: {
          devicesCount: { $size: "$devices" },
          role: "$roleInfo.name", // Extract role name
          subActiveTill: {
            $cond: { if: "$subActive", then: "$subActiveTill", else: null },
          },
          subscriptionStatus: {
            $cond: { if: "$subActive", then: "Active", else: "Inactive" },
          },
        },
      },
      // Project final fields
      {
        $project: {
          password: 0,
          roleInfo: 0,
          devices: 0, // Remove array after counting
        },
      },
      // Pagination facet
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: page } }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result = await User.aggregate(aggregationPipeline);
    const users = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0, page };

    logger.info("Retrieved paginated users");
    res.status(200).json({
      status: "success",
      data: users,
      pagination: {
        total: metadata.total,
        page: metadata.page,
        limit,
        totalPages: Math.ceil(metadata.total / limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error}`);
    throw new BadRequestError(`Error fetching users: ${error}`);
  }
};
