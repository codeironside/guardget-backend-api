import { Device } from "@/Api/Device/models";
import { DeviceModel } from "@/Api/Device/interface";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import { DeviceStatus } from "@/Api/Device/interface";
import { SubscriptionModel } from "@/Api/Subscription/interface";

export class DeviceService {
  static async validateDeviceLimit(userId: string): Promise<void> {
    const user = await User.findById(userId).populate("subscription");

    if (!user?.subscription) {
      throw new BadRequestError("No active subscription");
    }

    const deviceCount = await Device.countDocuments({ UserId: userId });
    if (deviceCount >= user.subscription.NoOfDecives) {
      throw new BadRequestError("Device limit reached");
    }
  }

  static async createDevice(data: Partial<DeviceModel>): Promise<DeviceModel> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const device = await Device.create([data], { session });
      await session.commitTransaction();
      return device[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateDeviceStatus(
    deviceId: string,
    userId: string,
    status: DeviceStatus
  ): Promise<DeviceModel> {
    const device = await Device.findOneAndUpdate(
      { _id: deviceId, UserId: userId },
      { status },
      { new: true, runValidators: true }
    );

    if (!device) throw new BadRequestError("Device not found");
    return device;
  }

  static async transferDevice(
    deviceId: string,
    currentUserId: string,
    newUserId: string
  ): Promise<DeviceModel> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const newUser = await User.findById(newUserId).populate("subscription");
      if (!newUser?.subscription) {
        throw new BadRequestError("Recipient has no active subscription");
      }

      const newUserDeviceCount = await Device.countDocuments({
        UserId: newUserId,
      });
      if (newUserDeviceCount >= newUser.subscription.NoOfDecives) {
        throw new BadRequestError("Recipient device limit reached");
      }

      const device = await Device.findByIdAndUpdate(
        deviceId,
        { UserId: newUserId, status: DeviceStatus.INACTIVE },
        { new: true, session }
      );

      if (!device) throw new BadRequestError("Device not found");
      await session.commitTransaction();
      return device;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getUserDevices(userId: string): Promise<DeviceModel[]> {
    return Device.find({ UserId: userId });
  }

  static async findByIMEI(imei: string, userId: string): Promise<DeviceModel> {
    const device = await Device.findOne({
      $or: [{ IMIE1: imei }, { IMEI2: imei }],
      UserId: userId,
    });

    if (!device) throw new BadRequestError("Device not found");
    return device;
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

      if (!device) {
        throw new BadRequestError("Device not found");
      }

      if (device.UserId.toString() !== currentUserId) {
        throw new BadRequestError("You do not own this device");
      }

      const newUser = await User.findOne({ email: newUserEmail.toLowerCase() })
        .populate<{ subscription: SubscriptionModel }>("subscription")
        .session(session);

      if (!newUser) {
        throw new BadRequestError("Recipient not found");
      }
      if (!newUser.subActive || !newUser.subscription) {
        throw new BadRequestError("Recipient has no active subscription");
      }

      if (newUser.subActiveTill && newUser.subActiveTill < new Date()) {
        throw new BadRequestError("Recipient subscription has expired");
      }
      const deviceCount = await Device.countDocuments({
        UserId: newUser._id,
      }).session(session);

      if (deviceCount >= newUser.subscription.NoOfDecives) {
        throw new BadRequestError(
          `Recipient can only have ${newUser.subscription.NoOfDecives} devices`
        );
      }
      const updatedDevice = await Device.findByIdAndUpdate(
        device._id,
        {
          UserId: newUser._id,
          status: DeviceStatus.INACTIVE,
        },
        { new: true, session }
      ).session(session);

      if (!updatedDevice) {
        throw new BadRequestError("Transfer failed");
      }

      await session.commitTransaction();
      return updatedDevice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
