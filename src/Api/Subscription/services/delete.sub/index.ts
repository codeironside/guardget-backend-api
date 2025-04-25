import { Request, Response } from "express";
import { Subscription } from "@/Api/Subscription/model";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
export const deleteSubscription = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      throw new BadRequestError("Subscription not found");
    }

    Logger.warn(`Deleted subscription: ${id}`);
    res.status(200).json({
      status: "success",
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    Logger.error(`Error deleting subscription: ${error}`);
    throw new BadRequestError(`Error deleting subscription: ${error}`);
  }
};
