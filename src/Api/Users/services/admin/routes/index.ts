import { Router } from "express";
import { authenticate } from "@/core/middleware/authmiddleware";
import { RoleGuard } from "@/core/middleware/roleMiddleware";
import { getAllUsers } from "../Users/get.all.users";
import { getAdminDashboard } from "../Users/get.one.admin";
import { getUser } from "../../get.One.users";
import { updateUser } from "../Users/update.user";
import { getAllDevices } from "../Device/get.all.devices";
import { getUserDevices } from "../Device/get.all.devices.for.a.user";
import { getOneUserDevice } from "../Device/get.one.user.device";
import { getAllReceipts } from "../Receipts/get.all.receipts";
import { getUserReceipts } from "../Receipts/get.all.receipts.for.a.user";
import { getOneReceipt } from "../Receipts/get.one.receipts";
import { createAdmin } from "../Users/create.admin";
import { TransferredDevice } from "@/Api/Device/interface";
import { transferedDevices } from "../Device/device.tansfers";
import { toggleUserStatus } from "../Users/Deactivate.users";
import { AdminUpdateDeviceStatus } from "../Device/report.device";
export const adminRouter = Router();

adminRouter.use(authenticate);
RoleGuard.allow("admin");

//user management
adminRouter.get("/getalluser", RoleGuard.allow("admin"), getAllUsers);
adminRouter.post("/createadmin", RoleGuard.allow("admin"), createAdmin)
adminRouter.get("/getOneself", RoleGuard.allow("admin"), getAdminDashboard);
adminRouter.get("/getoneuser/:id", RoleGuard.allow("admin"), getUser);
adminRouter.put("/updateuser/:id", RoleGuard.allow("admin"), updateUser);

//Device management
adminRouter.get("/getdeVices", RoleGuard.allow("admin"), getAllDevices);
adminRouter.get(
  "/device-transfers",
  RoleGuard.allow("admin"),
  transferedDevices
);
adminRouter.get(
  "/getallforauser/:userId",
  RoleGuard.allow("admin"),
  getUserDevices
);
adminRouter.get(
  "/getOneDevice/:userId/devices/:deviceId",
  RoleGuard.allow("admin"),
  getOneUserDevice
);
adminRouter.get("/getAllreceipt", RoleGuard.allow("admin"), getAllReceipts);
adminRouter.get(
  "/getUserReceipts/:userId",
  RoleGuard.allow("admin"),
  getUserReceipts
);
adminRouter.get(
  "/getOneReceipt/:receiptId",
  RoleGuard.allow("admin"),
  getOneReceipt
);
adminRouter.patch(
  "/:id/deactivate",
  RoleGuard.allow("admin"),
  toggleUserStatus
);
adminRouter.put(
  "/report-device/:id",
  RoleGuard.allow("admin"),
  AdminUpdateDeviceStatus
);