// src/Api/Users/services/getOneUser.ts
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User, UserModel } from "@/Api/Users/model/users";
import { RolesModel } from "../../interfaces/user.dto";
import { SubscriptionModel } from "@/Api/Subscription/interface";
import { Device } from "@/Api/Device/models";
import { DeviceModel } from "@/Api/Device/interface";
import { Receipt } from "@/Api/Financial/model";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";

interface PopulatedUser extends Omit<UserModel, "role" | "subId"> {
  role: RolesModel;
  subId: SubscriptionModel | null;
}

export const getUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.userId;
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestError("Invalid user ID format");
    }
    const userObjectId = new mongoose.Types.ObjectId(id);

    const user = (await User.findById(userObjectId)
      .select("-password")
      .populate("role", "name description")
      .populate("subscription", "name price description")
      .lean()) as PopulatedUser | null;

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // Fetch all devices for this user
    const devices = await Device.find({ UserId: userObjectId })
      .select("name IMIE1 IMEI2 serialNumber Type status createdAt")
      .lean<DeviceModel[]>()
      .exec();

    // Receipt summary aggregation
    const [summary] = await Receipt.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          receiptCount: { $sum: 1 },
          lastPayment: { $max: "$date" },
          averagePayment: { $avg: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalSpent: 1,
          receiptCount: 1,
          lastPayment: 1,
          averagePayment: { $round: ["$averagePayment", 2] },
        },
      },
    ]).exec();

    const financialSummary = summary ?? {
      totalSpent: 0,
      receiptCount: 0,
      lastPayment: null,
      averagePayment: 0,
    };

    const response = {
      userDetails: {
        ...user,
        role: user.role.name,
        subscription: user.subId,
      },
      devices,
      financialSummary,
    };

    logger.info(`Fetched user ${id} for`);
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    logger.error("Error in getOneUser:");
    next(
      new BadRequestError(
        err instanceof Error ? err.message : "Failed to fetch user"
      )
    );
  }
};
