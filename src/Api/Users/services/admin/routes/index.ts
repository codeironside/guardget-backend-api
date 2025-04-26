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

export const adminRouter = Router()

adminRouter.use(authenticate)
RoleGuard.allow("admin")


//user management
adminRouter.get("/getalluser", getAllUsers)
adminRouter.get("/getOneself", getAdminDashboard)
adminRouter.get("/getoneuser/:id", getUser)
adminRouter.put("/admin_priviledgs",updateUser)

//Device management
adminRouter.get("/getdeVices", getAllDevices)
adminRouter.get("/getallforauser/:userId", getUserDevices)
adminRouter.get("/getOneDevice/:userid/devices/:deviceId", getOneUserDevice)

//Receipt management
adminRouter.get("/getAllreceipt", getAllReceipts)
adminRouter.get("/getUserReceipts/:userId", getUserReceipts)
adminRouter.get("/getOneReceipt/:receiptId", getOneReceipt)





