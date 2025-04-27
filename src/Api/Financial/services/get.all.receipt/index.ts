
import { Request, Response, NextFunction } from "express";
import { Receipt } from "@/Api/Financial/model";
import { BadRequestError } from "@/core/error";
import logger from "@/core/logger";
import mongoose from "mongoose";

export const getReceiptsForUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const receipts = await Receipt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate<{ subscriptionId: { name: string } }>("subscriptionId", "name")
      .lean();

    if (receipts.length === 0) {
      res.status(200).json({
        status: "success",
        data: [],
        message: "No receipts found",
      });
      return;
    }

    const response = receipts.map((r) => ({
      id: r._id.toString(),
      amount: r.amount,
      date: r.date,
      description: r.description,
      status: r.status,
      receiptNumber: r.receiptNumber,
      subscriptionName: r.subscriptionId?.name || "Unknown",
      createdAt: r.createdAt,
    }));

    logger.info(`Fetched ${response.length} receipts for user ${userId}`);
    res.status(200).json({ status: "success", data: response });
  } catch (error) {
    logger.error(`Failed to retrieve receipts: ${error}`);
    if (error instanceof mongoose.Error.CastError) {
      return next(new BadRequestError("Invalid user ID format"));
    }
    return next(
      new BadRequestError(
        error instanceof Error ? error.message : "Failed to retrieve receipts"
      )
    );
  }
};
