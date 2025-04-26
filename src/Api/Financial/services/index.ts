import { Request, Response } from "express";
import { PaymentService } from "@/core/services/payment.service";
import { BadRequestError } from "@/core/error";
import { z } from "zod";
import { User } from "@/Api/Users/model/users";
import { Subscription } from "@/Api/Subscription/model"

import mongoose from "mongoose";
const paymentSchema = z.object({
  duration: z.number().positive(),
  durationUnit: z.enum(["days", "months", "years"]),
  subId: z.string(),
});

export class PaymentController {
  private service = new PaymentService();

  async initializePayment(req: Request, res: Response) {
    try {
      const { duration, durationUnit, subId } = paymentSchema.parse(req.body);
      const userEmail = await User.findById(req.userId);
      const objectId = new mongoose.Types.ObjectId(req.userId);
      const subidamount = await Subscription.findById(subId);
      const result = await this.service.initializePayment(
        objectId,
        duration,
        durationUnit,
        subidamount?.price!,
        userEmail?.email!
      );

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      throw new BadRequestError(
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(", ")
          : "Failed to initialize payment"
      );
    }
  }

  async handlePaymentCallback(req: Request, res: Response) {
    try {
      const { reference } = req.query;
      if (!reference || typeof reference !== "string") {
        throw new BadRequestError("Missing payment reference");
      }

      const receipt = await this.service.verifyPayment(reference);

      res.json({
        status: "success",
        data: {
          id: receipt._id,
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
