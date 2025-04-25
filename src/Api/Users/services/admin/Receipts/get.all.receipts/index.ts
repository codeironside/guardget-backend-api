import { Receipt } from "@/Api/Financial/model";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";


export const getAllReceipts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receipts = await Receipt.aggregate([
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
                phoneNumber: 1,
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
    ]);

    logger.info("Fetched all receipts");
    res.status(200).json({
      status: "success",
      data: receipts,
    });
  } catch (error) {
    logger.error(`Error fetching receipts: ${error}`);
    throw new BadRequestError(`Error fetching receipts: ${error}`);
  }
};