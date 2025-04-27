import { Request, Response } from "express";
import { handleFileUpload } from "@/core/services/filehelper";
import logger from "@/core/logger";
import {BadRequestError} from "@/core/error";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const url = await handleFileUpload(req);
    logger.info(`File uploaded successfully: ${url} for user: ${userId}`);
    res.status(200).json({ status: "success", url });
  } catch (err: unknown) {
      logger.error(`File upload failed: ${err}`);
    const message = err instanceof Error ? err.message : String(err);
    throw new BadRequestError(`File upload failed: ${message}`);
  }
};
