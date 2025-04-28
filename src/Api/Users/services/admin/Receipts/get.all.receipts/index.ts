import { Receipt } from "@/Api/Financial/model";
import { Request, Response, NextFunction } from "express";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

export const getAllReceipts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
    const skip = (page - 1) * limit;

    const agg = Receipt.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                phoneNumber: 1,
                imageurl: 1,
                subscriptionStatus: {
                  $cond: ["$subActive", "Active", "Inactive"],
                },
              },
            },
          ],
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          amount: 1,
          currency: 1,
          status: 1,
          paymentMethod: 1,
          createdAt: 1,
          updatedAt: 1,
          user: 1,
          formattedDate: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M:%S",
              date: "$createdAt",
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
      {
        $unwind: {
          path: "$metadata",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          total: "$metadata.total",
          data: 1,
        },
      },
    ]);

    const [result] = await agg.exec();
    const total = result?.total ?? 0;
    const receipts = result?.data ?? [];

    logger.info("Fetched paginated receipts");
    res.status(200).json({
      status: "success",
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: receipts,
    });
  } catch (error) {
    logger.error(`Error fetching receipts: ${error}`);
    next(new BadRequestError(`Error fetching receipts: ${error}`));
  }
};
