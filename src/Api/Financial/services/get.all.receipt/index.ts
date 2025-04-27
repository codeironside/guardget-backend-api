
import { Request, Response } from "express";
import { Receipt } from "@/Api/Financial/model";
import { BadRequestError } from "@/core/error";
import logger from "@/core/logger";
import mongoose from "mongoose";

interface ReceiptResponse {
  id: string;
  amount: number;
  date: Date;
  description: string;
  status: string;
  receiptNumber: string;
  duration: number;
  durationUnit: string;
  createdAt: Date;
}

export const getReceiptsForUsers = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const receipts = await Receipt.find({ userId })
      .sort({ createdAt: -1 }) 
      .lean();

    if (!receipts || receipts.length === 0) {
      res.status(200).json({
        status: "success",
        data: [],
        message: "No receipts found",
      });
    }

    const response: ReceiptResponse[] = receipts.map((receipt) => ({
      id: receipt._id.toString(),
      amount: receipt.amount,
      date: receipt.date,
      description: receipt.description,
      status: receipt.status,
      receiptNumber: receipt.receiptNumber,
      duration: receipt.duration,
      durationUnit: receipt.durationUnit,
      createdAt: receipt.createdAt,
    }));
    logger.info(`fetched all receipts for user with id : ${userId}`)
    res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    logger.error(`Failed to retrieve receipts: ${error}`);

    if (error instanceof mongoose.Error.CastError) {
      throw new BadRequestError("Invalid user ID format");
    }

    throw new BadRequestError(
      error instanceof Error ? error.message : "Failed to retrieve receipts"
    );
  }
};
