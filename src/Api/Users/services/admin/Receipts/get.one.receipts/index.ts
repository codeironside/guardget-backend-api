import { Receipt } from "@/Api/Financial/model";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";

export const getOneReceipt = async (
  req: Request<{ receiptId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { receiptId } = req.params;

    const receipt = await Receipt.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(receiptId) },
      },
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
          transactionId: 1,
          createdAt: 1,
          user: 1,
          formattedDetails: {
            amount: { $divide: ["$amount", 100] },
            date: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
            time: { $dateToString: { date: "$createdAt", format: "%H:%M:%S" } },
          },
        },
      },
    ]);

    if (!receipt.length) {
      throw new BadRequestError("Receipt not found");
    }

    logger.info(`Fetched receipt ${receiptId}`);
    res.status(200).json({
      status: "success",
      data: receipt[0],
    });
  } catch (error) {
    logger.error(`Error fetching receipt: ${error}`);
    throw new BadRequestError(`Error fetching receipt: ${error}`);
  }
};