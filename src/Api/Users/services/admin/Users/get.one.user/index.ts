import { User } from "@/Api/Users/model/users";
import { Device } from "@/Api/Device/models";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";
import { Request, Response } from "express";

interface userId {
  id: string;
}

export const getUser = async (req: Request<userId>, res: Response): Promise<void> => {
  try {
    const {id} = req.params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      throw new BadRequestError("User not found");
    }
    const devicesCount = await Device.countDocuments({ user: id });
    const formattedUser = {
      ...user,
      role: user.role.toString(),
      devices: devicesCount,
      subActiveTill: user.subActive ? user.subActiveTill : null,
      subscriptionStatus: user.subActive ? "Active" : "Inactive",
    };

    logger.info(`Retrieved user ${id}`);
    res.status(200).json({
      status: "success",
      data: formattedUser,
    });
  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    throw new BadRequestError(`Error fetching user: ${error}`);
  }
};
