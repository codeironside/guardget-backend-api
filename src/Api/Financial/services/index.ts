import { Request, Response } from "express";
import { PaymentService } from "@/core/services/payment.service";
import { BadRequestError } from "@/core/error";
import { z } from "zod";
import mongoose from "mongoose";
import { User } from "@/Api/Users/model/users";
import { Subscription } from "@/Api/Subscription/model";
import logger from "@/core/logger";
import { config } from "@/core/utils/config";

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

      // Include callback URL that points to your backend
      const { authorizationUrl, reference } =
        await this.service.initializePayment(
          userId,
          subscription._id,
          duration,
          durationUnit,
          amount,
          user.email,
          // Add callback URL parameter
          `${config.BACKEND_BASE_URL}/api/payment/callback`
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

  // NEW: Backend callback endpoint that handles Paystack redirect
  async handlePaymentCallback(req: Request, res: Response) {
    try {
      const reference = String(req.query.reference || "");
      if (!reference) {
        // Redirect to frontend with error
        return res.redirect(
          `${config.FRONTEND_URL}/dashboard/subscriptions?status=error&message=${encodeURIComponent('Missing payment reference')}`
        );
      }

      // Verify payment
      const receipt = await this.service.verifyPayment(reference);
      const subscription = await Subscription.findById(receipt.subscriptionId).select("name");
      
      logger.info(`Payment verified successfully for reference ${reference}`);
      
      // Redirect to frontend with success status
      return res.redirect(
        `${config.FRONTEND_URL}/dashboard/subscriptions?status=success&message=${encodeURIComponent('Payment verified successfully! Your subscription has been activated.')}`
      );
      
    } catch (error) {
      logger.error(`Payment callback error: ${error}`);
      
      // Redirect to frontend with error status
      return res.redirect(
        `${config.FRONTEND_URL}/dashboard/subscriptions?status=error&message=${encodeURIComponent('Payment verification failed. Please contact support if money was deducted.')}`
      );
    }
  }

  // KEEP: API endpoint for manual verification (if needed)
  async verifyPayment(req: Request, res: Response) {
    try {
      const reference = String(req.query.reference || "");
      if (!reference) throw new BadRequestError("Missing payment reference");

      const receipt = await this.service.verifyPayment(reference);
      const subscription = await Subscription.findById(receipt.subscriptionId).select("-_id name");
      
      logger.info(`Payment verified for reference ${reference}`);
      
      res.status(200).json({
        status: "success",
        data: {
          id: receipt._id,
          subscription: subscription,
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