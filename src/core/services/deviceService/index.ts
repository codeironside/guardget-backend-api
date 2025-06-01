import { Device } from "@/Api/Device/models";
import { DeviceModel } from "@/Api/Device/interface";
import { User } from "@/Api/Users/model/users";
import { BadRequestError } from "@/core/error";
import mongoose from "mongoose";
import { DeviceStatus } from "@/Api/Device/interface";
import { SubscriptionModel } from "@/Api/Subscription/interface";
import { TransferredDevice } from "@/Api/Device/interface";
import { TransferredDeviceModel } from "@/Api/Device/models/transfer_history";
import { TRANSFER_EXPIRY_HOURS } from "@/core/utils/types/global";

type DeviceCreateData = {
  name?: string;
  serialNumber?: string;
  type?: string;
  IMEI1?: string;
  IMEI2?: string;
  status?: string;
  purchaseDate?: string;
  notes?: string;
  UserId?: mongoose.Types.ObjectId;
};

interface MongoIndex {
  v: number;
  key: Record<string, number>;
  name: string;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
}

function mapInputToDbFields(data: DeviceCreateData): any {
  const mapped: any = {};

  Object.keys(data).forEach((key) => {
    if (key !== "type" && key !== "IMEI1" && key !== "IMEI2") {
      mapped[key] = data[key as keyof DeviceCreateData];
    }
  });

  if (data.type !== undefined) {
    mapped.Type = data.type;
  }

  if (data.IMEI1 && data.IMEI1.trim() !== "") {
    mapped.IMIE1 = data.IMEI1.trim();
  }

  if (data.IMEI2 && data.IMEI2.trim() !== "") {
    mapped.IMEI2 = data.IMEI2.trim();
  }

  return mapped;
}

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

  static async createDevice(data: DeviceCreateData): Promise<any> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const mappedData = mapInputToDbFields(data);

      const FIELD_MAPPINGS = {
        IMEI1: "IMIE1",
        IMEI2: "IMEI2",
        serialNumber: "serialNumber",
      } as const;

      const conflictChecks: Array<{
        field: string;
        inputValue: string;
        dbField: string;
        query: Record<string, string>;
      }> = [];

      if (data.IMEI1?.trim()) {
        conflictChecks.push({
          field: "IMEI1",
          inputValue: data.IMEI1.trim(),
          dbField: FIELD_MAPPINGS.IMEI1,
          query: { [FIELD_MAPPINGS.IMEI1]: data.IMEI1.trim() },
        });
      }

      if (data.IMEI2?.trim()) {
        conflictChecks.push({
          field: "IMEI2",
          inputValue: data.IMEI2.trim(),
          dbField: FIELD_MAPPINGS.IMEI2,
          query: { [FIELD_MAPPINGS.IMEI2]: data.IMEI2.trim() },
        });
      }

      if (data.serialNumber?.trim()) {
        conflictChecks.push({
          field: "serialNumber",
          inputValue: data.serialNumber.trim(),
          dbField: FIELD_MAPPINGS.serialNumber,
          query: { [FIELD_MAPPINGS.serialNumber]: data.serialNumber.trim() },
        });
      }

      for (const check of conflictChecks) {
        const conflict = await Device.findOne(check.query, null, { session });

        if (conflict) {
          const conflictObj = conflict.toObject();
          const conflictValue =
            conflictObj[check.dbField as keyof typeof conflictObj];

          const isExactMatch = check.field.includes("IMEI")
            ? conflictValue?.toString().toLowerCase() ===
              check.inputValue.toLowerCase()
            : conflictValue?.toString() === check.inputValue;

          if (isExactMatch) {
            throw new BadRequestError(
              `${check.field} "${check.inputValue}" is already in use`
            );
          }
        }
      }

      if (conflictChecks.length > 0) {
        const combinedQuery = {
          $or: conflictChecks.map((check) => check.query),
        };

        const allConflicts = await Device.find(combinedQuery, null, {
          session,
        });

        if (allConflicts.length > 0) {
          for (const conflict of allConflicts) {
            const conflictObj = conflict.toObject();

            for (const check of conflictChecks) {
              const conflictValue =
                conflictObj[check.dbField as keyof typeof conflictObj];

              if (conflictValue) {
                const isExactMatch = check.field.includes("IMEI")
                  ? conflictValue.toString().toLowerCase() ===
                    check.inputValue.toLowerCase()
                  : conflictValue.toString() === check.inputValue;

                if (isExactMatch) {
                  const deviceName = conflictObj.name || conflict._id;
                  throw new BadRequestError(
                    `${check.field} "${check.inputValue}" is already in use by device: ${deviceName}`
                  );
                }
              }
            }
          }
        }
      }

      const [created] = await Device.create([mappedData], { session });
      const populated = await Device.findById(created._id)
        .populate("UserId", "username email")
        .session(session);

      await session.commitTransaction();
      return populated!;
    } catch (err: any) {
      await session.abortTransaction();

      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];

        if (field === "IMEI2" && value === null) {
          throw new BadRequestError(
            "Database index error: Multiple devices cannot have empty IMEI2. Please contact support."
          );
        }

        throw new BadRequestError(`${field} "${value}" is already in use`);
      }

      throw err;
    } finally {
      session.endSession();
    }
  }

  static async fixIndexes(): Promise<void> {
    try {
      console.log("Checking and fixing database indexes...");

      const collection = Device.collection;
      const indexes = (await collection
        .listIndexes()
        .toArray()) as MongoIndex[];

      console.log(
        "Current indexes:",
        indexes.map((idx) => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique,
          sparse: idx.sparse,
        }))
      );

      const indexesToFix = indexes.filter(
        (index) =>
          (index.name === "IMEI2_1" || index.name === "IMIE1_1") &&
          index.unique &&
          !index.sparse
      );

      if (indexesToFix.length > 0) {
        console.log(
          "Found non-sparse unique indexes that need fixing:",
          indexesToFix.map((idx) => idx.name)
        );

        for (const index of indexesToFix) {
          console.log(`Dropping non-sparse index: ${index.name}`);
          try {
            await collection.dropIndex(index.name);
            console.log(`Successfully dropped index: ${index.name}`);
          } catch (error: any) {
            if (error.code === 27) {
              console.log(`Index ${index.name} doesn't exist, skipping...`);
            } else {
              console.error(
                `Error dropping index ${index.name}:`,
                error.message
              );
            }
          }

          console.log(
            `Creating new sparse index for: ${Object.keys(index.key)[0]}`
          );
          try {
            await collection.createIndex(index.key, {
              unique: true,
              sparse: true,
              name: `${index.name}_sparse`,
            });
            console.log(
              `Successfully created sparse index: ${index.name}_sparse`
            );
          } catch (error: any) {
            if (error.code === 85) {
              console.log(`Index already exists, skipping...`);
            } else {
              console.error(`Error creating index:`, error.message);
            }
          }
        }
      } else {
        console.log(
          "All indexes are already properly configured with sparse option!"
        );
      }

      console.log("Index fix completed!");
    } catch (error) {
      console.error("Index fix error:", error);
    }
  }

  static async validateFieldMappings(): Promise<void> {
    try {
      const sampleDevice = await Device.findOne().limit(1);
      if (sampleDevice) {
        const deviceObj = sampleDevice.toObject();
        console.log("Database field validation:");
        console.log("Available fields:", Object.keys(deviceObj));

        const expectedFields = ["IMIE1", "IMEI2", "serialNumber", "Type"];
        const missingFields = expectedFields.filter(
          (field) => !(field in deviceObj)
        );

        if (missingFields.length > 0) {
          console.warn("Missing expected fields:", missingFields);
        } else {
          console.log("✅ All expected fields found in database schema");
        }

        const imeiFields = Object.keys(deviceObj).filter(
          (key) =>
            key.toLowerCase().includes("imei") ||
            key.toLowerCase().includes("imie")
        );
        const serialFields = Object.keys(deviceObj).filter(
          (key) =>
            key.toLowerCase().includes("serial") || key.toLowerCase() === "sn"
        );

        console.log("IMEI-related fields found:", imeiFields);
        console.log("Serial-related fields found:", serialFields);
      }
    } catch (error) {
      console.error("Field validation error:", error);
    }
  }

  static async transferDeviceByDetails(
    deviceId: string,
    currentUserId: string,
    newUserEmail: string,
    reason: string
  ): Promise<DeviceModel> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const device = await Device.findById(deviceId).session(session);

      if (!device) throw new BadRequestError("Device not found");
      if (device.UserId.toString() !== currentUserId) {
        throw new BadRequestError("Unauthorized device transfer");
      }
      if (device.status.toString() === DeviceStatus.TRANSFER_PENDING) {
        throw new BadRequestError(
          `Device cannot be transferred while under ${TRANSFER_EXPIRY_HOURS}-day review`
        );
      }

      const newUser = await User.findOne({ email: newUserEmail.toLowerCase() })
        .populate("subId")
        .session(session);
      if (!newUser) throw new BadRequestError("Recipient not found");

      const transferDate = new Date();
      transferDate.setHours(transferDate.getHours() + TRANSFER_EXPIRY_HOURS);

      await TransferredDeviceModel.create(
        [
          {
            name: device.name,
            IMIE1: device.IMIE1,
            IMEI2: device.IMEI2,
            serialNumber: device.serialNumber,
            Type: device.Type,
            fromID: new mongoose.Types.ObjectId(currentUserId),
            toID: newUser._id,
            status: DeviceStatus.TRANSFER_PENDING,
            transferDate: transferDate,
            reason: reason,
          },
        ],
        { session }
      );

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
        const currentDate = new Date();
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
              _id: "$serialNumber",
              latestTransfer: { $first: "$$ROOT" },
            },
          },
          { $replaceRoot: { newRoot: "$latestTransfer" } },
          {
            $match: {
              transferDate: {
                $lte: currentDate,
              },
            },
          },
        ]).session(session);

        for (const transfer of expiredTransfers) {
          const recipient = await User.findById(transfer.toID)
            .populate("subId")
            .session(session);

          if (!recipient?.subId || recipient.subActiveTill < currentDate) {
            await TransferredDeviceModel.findByIdAndUpdate(
              transfer._id,
              { status: "failed", reason: "Recipient subscription invalid" },
              { session }
            );
            continue;
          }

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

          await Device.findOneAndUpdate(
            {
              serialNumber: transfer.serialNumber,
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
      session.endSession();
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

  static async AdminUpdateDeviceStatus(
    deviceId: string,
    userId: string,
    status: DeviceStatus,
    location: string,
    description: string
  ): Promise<DeviceModel> {
    try {
      console.log(deviceId, status, location, description);
      const updatedDevice = await Device.findOneAndUpdate(
        { _id: deviceId },
        { status, location, description },
        { new: true, runValidators: true }
      );

      if (!updatedDevice) {
        throw new BadRequestError("Device not found or unauthorized");
      }

      return updatedDevice;
    } catch (error) {
      console.log(error);
      throw new BadRequestError(
        error instanceof Error
          ? error.message
          : "Failed to update device status"
      );
    }
  }
}
