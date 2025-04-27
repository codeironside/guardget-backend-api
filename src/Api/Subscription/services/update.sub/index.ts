import { Request, Response } from "express";
import { Subscription } from "@/Api/Subscription/model";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import { SubscriptionModel } from "../../interface";
export const updateSubscription = async (
  req: Request<{ id: string }, {}, Partial<SubscriptionModel>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if subscription exists
    const existingSub = await Subscription.findById(id);
    if (!existingSub) {
      throw new BadRequestError("Subscription not found");
    }

    // Check for name conflict
    if (updateData.name && updateData.name !== existingSub.name) {
      const nameExists = await Subscription.findOne({ name: updateData.name });
      if (nameExists)
        throw new BadRequestError("Subscription name already in use");
    }

    // Validate numbers
    if (updateData.NoOfDevices && updateData.NoOfDevices <= 0) {
      throw new BadRequestError("Device count must be a positive value");
    }
    if (updateData.price && updateData.price <= 0) {
      throw new BadRequestError("Price must be a positive value");
    }

    const updatedSub = await Subscription.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    Logger.info(`Updated subscription: ${id}`);
    res.status(200).json({
      status: "success",
      message: "Subscription updated successfully",
      data: updatedSub,
    });
  } catch (error) {
    Logger.error(`Error updating subscription: ${error}`);
    throw new BadRequestError(`Error updating subscription: ${error}`);
  }
};
