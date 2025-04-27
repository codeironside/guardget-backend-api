// src/controllers/receipt.controller.ts
import { Request, Response } from "express";
import { Receipt } from "@/Api/Financial/model";
import { BadRequestError } from "@/core/error";
import logger from "@/core/logger";
import mongoose from "mongoose";

interface ReceiptResponse {
  id: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  receiptNumber: string;
  duration: number;
  durationUnit: string;
  subscriptionName: string;
  createdAt: string;
  updatedAt: string;
  
}

export const getOneReceiptForUser = async (req: Request, res: Response) => {
  try {
    const receiptId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.userId);
    console.log(`receipt ID: ${JSON.stringify(req.params)}`);
    if (!mongoose.Types.ObjectId.isValid(receiptId)) {
      throw new BadRequestError("Invalid receipt ID format");
    }

    const receipt = await Receipt.findOne({
      _id: receiptId,
      userId: userId,
    }).populate<{subscriptionId:{name:string}}>("subscriptionId", "name").lean();

    if (!receipt) {
      throw new BadRequestError("Receipt not found or unauthorized access");
    }

    const response: ReceiptResponse = {
      id: receipt._id.toString(),
      amount: receipt.amount,
      date: receipt.date.toISOString(),
      description: receipt.description,
      status: receipt.status,
      receiptNumber: receipt.receiptNumber,
      subscriptionName: receipt.subscriptionId?.name,
      duration: receipt.duration,
      durationUnit: receipt.durationUnit,
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
    };
    logger.warn(`fetched one receipt with ID: ${receipt._id}`)
    res.status(200).json({
      status: "success",
      data: response,
    });
  } catch (error) {
    logger.error(`Failed to retrieve receipt: ${error}`);

    if (error instanceof mongoose.Error.CastError) {
      throw new BadRequestError("Invalid ID format");
    }

    throw new BadRequestError(
      error instanceof Error ? error.message : "Failed to retrieve receipt"
    );
  }
};
