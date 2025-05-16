import { Router } from "express";
import { authenticate } from "@/core/middleware/authmiddleware";
import { createDevice } from "../services/create.device";
import { getAllDevices } from "../services/get.all.device";
import { getDevice } from "../services/get.one.device";
import { searchByIMEI } from "../services/search.by.IMIE";
import { transferDevice } from "../services/transfer.device";
import { updateDeviceStatus } from "../services/update.device.status";
import { TransferDeviceOTP } from "../services/transfer.device.otp";
import { resendDeviceResendOtpend } from "../services/resend.Device.transfer.Otp";
import { validateDeviceTransferOtp } from "../services/verify.Device.Transfer.Otp";
export const deviceRouter = Router();
deviceRouter.use(authenticate);

deviceRouter.post("/", createDevice);
deviceRouter.get("/", getAllDevices);
deviceRouter.get("/device/:deviceId", getDevice);
deviceRouter.get("/search", searchByIMEI);

deviceRouter.get("/transferOtp", TransferDeviceOTP);
deviceRouter.post("/resendDevicetransferOtp", resendDeviceResendOtpend);
deviceRouter.post("/verifyDeviceTransferOtp", validateDeviceTransferOtp);
deviceRouter.put("/transferOwnership", transferDevice);
deviceRouter.put("/updatestatus/:deviceId", updateDeviceStatus);
