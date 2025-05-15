import { Device } from "@/Api/Device/models";
import { DeviceModel } from "@/Api/Device/interface";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import { DeviceStatus } from "@/Api/Device/interface";
import { SubscriptionModel } from "@/Api/Subscription/interface";
import { TransferredDevice } from "@/Api/Device/interface";
import { TransferredDeviceModel } from "@/Api/Device/models/transfer_history";

export class DeviceService {
  static async validateDeviceLimit(userId: string): Promise<void> {
    const user = await User.findById(userId).populate("subId").exec();
    const subscription = user?.subId as unknown as SubscriptionModel;
    if (!subscription) {
      throw new BadRequestError("No active subscription");
    }

    const deviceCount = await Device.countDocuments({ UserId: userId });
    if (deviceCount >= subscription.NoOfDevices) {
      throw new BadRequestError("Device limit reached");
    }
  }
  static async createDevice(data: Partial<DeviceModel>): Promise<DeviceModel> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Uniqueness checks
      const conflicts = await Device.findOne(
        {
          $or: [
            { IMIE1: data.IMIE1 },
            data.IMEI2 ? { IMEI2: data.IMEI2 } : null,
            { SN: data.SN },
          ].filter(Boolean) as any[],
        },
        null,
        { session }
      );
      if (conflicts) {
        const field =
          conflicts.IMIE1 === data.IMIE1
            ? "IMIE1"
            : conflicts.IMEI2 === data.IMEI2
            ? "IMEI2"
            : "SN";
        throw new BadRequestError(`${field} already in use`);
      }

      const [created] = await Device.create([data], { session });
      const populated = await Device.findById(created._id)
        .populate("UserId", "username email")
        .session(session);

      await session.commitTransaction();
      return populated!;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async transferDeviceByDetails(
    imei: string,
    sn: string,
    currentUserId: string,
    newUserEmail: string
  ): Promise<DeviceModel> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Find device and validate ownership
      const device = await Device.findOne({
        $or: [{ IMIE1: imei }, { IMEI2: imei }],
        SN: sn,
      }).session(session);

      if (!device) throw new BadRequestError("Device not found");
      if (device.UserId.toString() !== currentUserId) {
        throw new BadRequestError("Unauthorized device transfer");
      }
      if (device.status.toString() === DeviceStatus.TRANSFER_PENDING) {
        throw new BadRequestError(
          "device can not be transfered while still under 21 days review"
        );
      }

      // Validate recipient
      const newUser = await User.findOne({ email: newUserEmail.toLowerCase() })
        .populate("subId")
        .session(session);
      if (!newUser) throw new BadRequestError("Recipient not found");

      // Create transfer history with 21-day timeline
      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() + 21);

      await TransferredDeviceModel.create(
        [
          {
            name: device.name,
            IMIE1: device.IMIE1,
            IMEI2: device.IMEI2,
            SN: device.SN,
            Type: device.Type,
            fromID: new mongoose.Types.ObjectId(currentUserId),
            toID: newUser._id,
            status: DeviceStatus.TRANSFER_PENDING,
            transferDate: transferDate,
          },
        ],
        { session }
      );

      // Mark device as transfer-pending without changing UserId
      const updatedDevice = await Device.findByIdAndUpdate(
        device._id,
        { status: DeviceStatus.TRANSFER_PENDING },
        { new: true, session }
      );

      await session.commitTransaction();
      return updatedDevice!;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getUserDevices(userId: string): Promise<DeviceModel[]> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const expiredTransfers = await TransferredDeviceModel.aggregate([
          {
            $match: {
              fromID: new mongoose.Types.ObjectId(userId),
              status: DeviceStatus.TRANSFER_PENDING,
            },
          },
          { $sort: { transferDate: -1 } },
          {
            $group: {
              _id: "$SN",
              latestTransfer: { $first: "$$ROOT" },
            },
          },
          { $replaceRoot: { newRoot: "$latestTransfer" } },
          {
            $match: {
              transferDate: {
                $lte: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
              },
            },
          },
        ]).session(session);

        for (const transfer of expiredTransfers) {
          // Validate recipient's subscription
          const recipient = await User.findById(transfer.toID)
            .populate("subId")
            .session(session);

          if (!recipient?.subId || recipient.subActiveTill < new Date()) {
            await TransferredDeviceModel.findByIdAndUpdate(
              transfer._id,
              { status: "failed", reason: "Recipient subscription invalid" },
              { session }
            );
            continue;
          }

          // Check recipient's device limit
          const deviceCount = await Device.countDocuments({
            UserId: transfer.toID,
          }).session(session);

          if (
            deviceCount >= (recipient.subId as SubscriptionModel).NoOfDevices
          ) {
            await TransferredDeviceModel.findByIdAndUpdate(
              transfer._id,
              { status: "failed", reason: "Recipient device limit reached" },
              { session }
            );
            continue;
          }

          // Proceed with transfer if validations pass
          await Device.findOneAndUpdate(
            {
              SN: transfer.SN,
              UserId: userId,
              status: DeviceStatus.TRANSFER_PENDING,
            },
            {
              UserId: transfer.toID,
              status: "active",
            },
            { session }
          );

          await TransferredDeviceModel.findByIdAndUpdate(
            transfer._id,
            { status: DeviceStatus.TRANSFER_APPROVED },
            { session }
          );
        }
      });

      return await Device.find({ UserId: userId })
        .sort({ createdAt: -1 })
        .populate("UserId", "username email")
        .lean()
        .session(session);
    } catch (error) {
      throw new BadRequestError("Failed to retrieve user devices");
    } finally {
      await session.endSession();
    }
  }

  static async updateDeviceStatus(
    deviceId: string,
    userId: string,
    status: DeviceStatus,
    location: string,
    description: string
  ): Promise<DeviceModel> {
    try {
      const updatedDevice = await Device.findOneAndUpdate(
        { _id: deviceId, UserId: userId },
        { status, location, description },
        { new: true, runValidators: true }
      );

      if (!updatedDevice) {
        throw new BadRequestError("Device not found or unauthorized");
      }

      return updatedDevice;
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error
          ? error.message
          : "Failed to update device status"
      );
    }
  }
}
