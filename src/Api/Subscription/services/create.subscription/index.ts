import { Request, Response } from "express";
import { Subscription } from "@/Api/Subscription/model";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import { SubscriptionModel } from "../../interface";

export const createSubscription = async (
  req: Request<{}, {}, SubscriptionModel>,
  res: Response
): Promise<void> => {
  try {
    const { name, NoOfDevices, price, description } = req.body;

    const existingSub = await Subscription.findOne({ name });
    if (existingSub) {
      throw new BadRequestError("Subscription with this name already exists");
    }

    if (NoOfDevices <= 0 || price <= 0) {
      throw new BadRequestError(
        "Devices count and price must be positive values"
      );
    }

    const newSubscription = await Subscription.create({
      name,
      NoOfDevices,
      price,
      description,
    });

    Logger.info(`Created new subscription: ${name}`);
    res.status(201).json({
      status: "success",
      message: "Subscription created successfully",
      data: newSubscription,
    });
  } catch (error) {
    Logger.error(`Error creating subscription: ${error}`);
    throw new BadRequestError(`Error creating subscription: ${error}`);
  }
};
