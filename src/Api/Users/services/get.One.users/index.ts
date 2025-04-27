import { User } from "../../model/users";
import { Device } from "@/Api/Device/models";
import logger from "@/core/logger";
import { BadRequestError } from "@/core/error";
import { Request, Response  } from "express";


interface userId{
    id:string
}

export const getUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id  = req.userId;

    const user = await User.findById(id)
      .select('-password -role')
      .lean();

    if (!user) {
      throw new BadRequestError('User not found');
    }
    const devicesCount = await Device.countDocuments({ user: id });
    const formattedUser = {
      devices: devicesCount,
      subActiveTill: user.subActive ? user.subActiveTill : null,
      subscriptionStatus: user.subActive ? 'Active' : 'Inactive'
    };

    logger.info(`Retrieved user ${id}`);
    res.status(200).json({
      status: "success",
      data: formattedUser
    });

  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    throw new BadRequestError(`Error fetching user: ${error}`);
  }
};

