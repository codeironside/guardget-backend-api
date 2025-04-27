// src/Api/Payments/controllers/payment.controller.ts
import { Request, Response } from "express";
import { PaymentService } from "@/core/services/payment.service";
import { BadRequestError } from "@/core/error";
import { z } from "zod";
import mongoose from "mongoose";
import { User } from "@/Api/Users/model/users";
import { Subscription } from "@/Api/Subscription/model";
import logger from "@/core/logger";

const paymentSchema = z.object({
  duration: z.number().positive(),
  durationUnit: z.enum(["months", "years"]),
  subId: z.string().length(24),
});

export class PaymentController {
  private service = new PaymentService();

  async initializePayment(req: Request, res: Response) {
    try {
      const { duration, durationUnit, subId } = paymentSchema.parse(req.body);
      const userId = new mongoose.Types.ObjectId(req.userId);
      const user = await User.findById(userId);
      if (!user) throw new BadRequestError("User not found");

      const subscription = await Subscription.findById(subId);
      if (!subscription)
        throw new BadRequestError("Subscription plan not found");

      let multiplier = 1;
      if (durationUnit === "months") {
        multiplier = duration;
      } else if (durationUnit === "years") {
        multiplier = duration * 12;
      }

      const amount = subscription.price * multiplier;

      const { authorizationUrl, reference } =
        await this.service.initializePayment(
          userId,
          subscription._id,
          duration,
          durationUnit,
          amount,
          user.email
        );
      logger.warn(
        `Payment initialized for user ${userId} with reference ${reference}`
      );
      res.status(200).json({
        status: "success",
        data: { authorizationUrl, reference },
      });
    } catch (error) {
      throw new BadRequestError(
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(", ")
          : error instanceof Error
          ? error.message
          : "Failed to initialize payment"
      );
    }
  }

  async handlePaymentCallback(req: Request, res: Response) {
    try {
      const reference = String(req.query.reference || "");
      if (!reference) throw new BadRequestError("Missing payment reference");

      const receipt = await this.service.verifyPayment(reference);
      const sub = await Subscription.findById(receipt.subscriptionId).select("-_id name");
      logger.info(`Payment verified for reference ${reference}`);
      res.status(200).json({
        status: "success",
        data: {
          id: receipt._id,
          subscription: sub,
          amount: receipt.amount,
          receiptNumber: receipt.receiptNumber,

          date: receipt.date,
        },
      });
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    }
  }
}
