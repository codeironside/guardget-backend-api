import { Request, Response } from "express";
import { Subscription } from "@/Api/Subscription/model";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";

export const getAllSubscriptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subscriptions = await Subscription.find({
      _id: { $ne: "683ae445cf6f920974019639" },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: subscriptions,
    });
  } catch (error) {
    Logger.error(`Error fetching subscriptions: ${error}`);
    throw new BadRequestError(`Error fetching subscriptions: ${error}`);
  }
};
