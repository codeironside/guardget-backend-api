import { Device } from "@/Api/Device/models";
import { DeviceModel } from "@/Api/Device/interface";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import { DeviceStatus } from "@/Api/Device/interface";
import { SubscriptionModel } from "@/Api/Subscription/interface";

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

      const device = await Device.create([data], { session });
      const populatedDevice = await Device.findById(device[0]._id)
        .populate("UserId", "username email")
        .session(session);

      await session.commitTransaction();
      return populatedDevice!;
    } catch (error) {
      await session.abortTransaction();
      throw error;
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

      const device = await Device.findOne({
        $or: [{ IMIE1: imei }, { IMEI2: imei }],
        SN: sn,
      }).session(session);

      if (!device) throw new BadRequestError("Device not found");
      if (device.UserId.toString() !== currentUserId) {
        throw new BadRequestError("Unauthorized device transfer");
      }

      const newUser = await User.findOne({ email: newUserEmail.toLowerCase() })
        .populate("subId")
        .session(session);

      if (!newUser) throw new BadRequestError("Recipient not found");

      const newUserSubscription = newUser.subId as unknown as SubscriptionModel;
      if (!newUser.subActive || !newUserSubscription) {
        throw new BadRequestError("Recipient has no active subscription");
      }

      if (newUser.subActiveTill && newUser.subActiveTill < new Date()) {
        throw new BadRequestError("Recipient subscription has expired");
      }

      const deviceCount = await Device.countDocuments({
        UserId: newUser._id,
      }).session(session);

      if (deviceCount >= newUserSubscription.NoOfDevices) {
        throw new BadRequestError(
          `Recipient can only have ${newUserSubscription.NoOfDevices} devices`
        );
      }

      const updatedDevice = await Device.findByIdAndUpdate(
        device._id,
        {
          UserId: newUser._id,
          status: DeviceStatus.INACTIVE,
        },
        { new: true, session }
      );

      if (!updatedDevice) throw new BadRequestError("Transfer failed");

      await session.commitTransaction();
      return updatedDevice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getUserDevices(userId: string): Promise<DeviceModel[]> {
    try {
      const devices = await Device.find({ UserId: userId })
        .sort({ createdAt: -1 })
        .lean();

      return devices;
    } catch (error) {
      throw new BadRequestError("Failed to retrieve user devices");
    }
  }

  static async updateDeviceStatus(
    deviceId: string,
    userId: string,
    status: DeviceStatus
  ): Promise<DeviceModel> {
    try {
      const updatedDevice = await Device.findOneAndUpdate(
        { _id: deviceId, UserId: userId },
        { status },
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
