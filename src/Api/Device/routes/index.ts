import { Router } from "express";
import { authenticate } from "@/core/middleware/authmiddleware";
import { createDevice } from "../services/create.device";
import { getAllDevices } from "../services/get.all.device";
import { getDevice } from "../services/get.one.device";
import { searchByIMEI } from "../services/search.by.IMIE";
import { transferDevice } from "../services/transfer.device";
import { updateDeviceStatus } from "../services/update.device.status";

export const deviceRouter = Router();
deviceRouter.use(authenticate);

deviceRouter.post("/", createDevice);
deviceRouter.get("/", getAllDevices);
deviceRouter.get("/device/:deviceId", getDevice);
deviceRouter.get("/search", searchByIMEI);
deviceRouter.put("/transferOwnership", transferDevice);
deviceRouter.put("/updatestatus/:deviceId", updateDeviceStatus);
