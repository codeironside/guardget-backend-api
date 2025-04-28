import { Receipt } from "@/Api/Financial/model";
import { Request, Response } from "express";
import logger from "@/core/logger";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
export const getUserReceipts = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId).select(
      "username email phoneNumber subActive"
    );

    if (!user) {
      throw new BadRequestError("User not found");
    }

    const receipts = await Receipt.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          currency: 1,
          status: 1,
          paymentMethod: 1,
          createdAt: 1,
          formattedAmount: {
            $divide: ["$amount", 100],
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    logger.info(`Fetched receipts for user ${userId}`);
    res.status(200).json({
      status: "success",
      data: {
        user: {
          ...user.toObject(),
          subscriptionStatus: user.subActive ? "Active" : "Inactive",
        },
        receipts,
      },
    });
  } catch (error) {
    logger.error(`Error fetching user receipts: ${error}`);
    throw new BadRequestError(`Error fetching user receipts: ${error}`);
  }
};