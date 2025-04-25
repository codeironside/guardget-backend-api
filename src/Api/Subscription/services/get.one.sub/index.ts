import { Request, Response } from "express";
import { Subscription } from "@/Api/Subscription/model";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";

export const getOneSubscription = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new BadRequestError("Subscription not found");
    }

    res.status(200).json({
      status: "success",
      data: subscription,
    });
  } catch (error) {
    Logger.error(`Error fetching subscription: ${error}`);
    throw new BadRequestError(`Error fetching subscription: ${error}`);
  }
};
