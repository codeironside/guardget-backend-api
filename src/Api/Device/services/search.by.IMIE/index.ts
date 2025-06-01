import { Request, Response } from "express";
import { Device } from "../../models";
import { BadRequestError } from "@/core/error";
import Logger from "@/core/logger";
import { TransferredDeviceModel } from "../../models/transfer_history";
import { Types } from "mongoose";
interface PopulatedTransfer {
  _id: Types.ObjectId;
  transferDate: Date;
  status: string;
  fromID: {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName?: string;
    surName?: string;
    middleName?: string;
    imageurl?: string;
  };
  toID: {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName?: string;
    surName?: string;
    middleName?: string;
    imageurl?: string;
  };
  serialNumber: string;
}

export const searchByIMEI = async (req: Request, res: Response) => {
  try {
    const { qparams } = req.query;
    const userId = req.userId;

    const device = await Device.findOne({
      $or: [{ IMIE1: qparams }, { IMEI2: qparams }, { serialNumber: qparams }],
    })
      .populate("UserId", "username email imageurl phoneNumber")
      .lean();

    if (!device) {
      throw new BadRequestError("Device not found");
    }

    // Get transfer history with proper typing
    const transferHistory = (await TransferredDeviceModel.find({
      serialNumber: device.serialNumber,
    })
      .populate<{
        fromID: PopulatedTransfer["fromID"];
        toID: PopulatedTransfer["toID"];
      }>("fromID", "username imageurl firstName surName middleName email _id")
      .populate(
        "toID",
        "username imageurl firstName surName middleName email _id"
      )
      .sort({ transferDate: -1 })
      .lean()) as unknown as PopulatedTransfer[];

    Logger.info(`IMEI search: ${qparams}`);
    res.json({
      status: "success",
      data: {
        ...mapDeviceResponse(device),
        transferHistory: transferHistory.map((transfer) => ({
          _id: transfer._id,
          transferDate: transfer.transferDate,
          status: transfer.status,
          from: {
            id: transfer.fromID._id,
            username: transfer.fromID.username,
            email: transfer.fromID.email,
            firstName: transfer.fromID.firstName,
            surName: transfer.fromID.surName,
            middleName: transfer.fromID.middleName,
            imageurl: transfer.fromID.imageurl,
          },
          to: {
            id: transfer.toID._id,
            username: transfer.toID.username,
            email: transfer.toID.email,
            firstName: transfer.toID.firstName,
            surName: transfer.toID.surName,
            middleName: transfer.toID.middleName,
            imageurl: transfer.toID.imageurl,
          },
        })),
      },
    });
  } catch (error) {
    Logger.error(`IMEI search failed: ${error}`);
    throw new BadRequestError(
      error instanceof Error ? error.message : "Device search failed"
    );
  }
};;

const mapDeviceResponse = (device: any) => ({
  id: device._id,
  name: device.name,
  IMIE1: device.IMIE1,
  IMEI2: device.IMEI2,
  serialNumber: device.serialNumber,
  Type: device.Type,
  status: device.status,
  location: device.location,
  user: {
    id: device.UserId._id,
    username: device.UserId.username,
    email: device.UserId.email,
    imageurl: device.UserId.imageurl,
    phoneNumber:device.UserId.phoneNumber
  },
  updatedAt: device.updatedAt,
});
