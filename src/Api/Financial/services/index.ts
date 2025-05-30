import { Request, Response } from "express";
import { PaymentService } from "@/core/services/payment.service";
import { BadRequestError } from "@/core/error";
import { z } from "zod";
import mongoose from "mongoose";
import { User } from "@/Api/Users/model/users";
import { Subscription } from "@/Api/Subscription/model";
import logger from "@/core/logger";
import { config } from "@/core/utils/config";
import { API_SUFFIX } from "@/core/utils/types/global";

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
      const user = await User.findById(req.userId);
      console.log(`user ${userId}`);
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
          // This points to your backend callback endpoint
          `${config.BACKEND_BASE_URL}${API_SUFFIX}/payment/callback`
        );

      logger.warn(
        `Payment initialized for user ${userId} with reference ${reference}`
      );

      res.status(200).json({
        status: "success",
        data: { authorizationUrl, reference },
      });
    } catch (error) {
      console.log(`error messages ${error}`);
      throw new BadRequestError(
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(", ")
          : error instanceof Error
          ? error.message
          : "Failed to initialize payment"
      );
    }
  }

  // NEW: Backend callback that handles Paystack redirect (GET request)
  // async handlePaymentCallback(req: Request, res: Response) {
  //   try {
  //     const reference = String(req.query.reference || "");
  //     if (!reference) {
  //       logger.error("Payment callback missing reference");
  //       // Redirect to frontend with error
  //       return res.redirect(
  //         `${
  //           config.FRONTEND_URL
  //         }/dashboard/subscriptions?status=error&message=${encodeURIComponent(
  //           "Missing payment reference"
  //         )}`
  //       );
  //     }

  //     logger.info(`Processing payment callback for reference: ${reference}`);

  //     // Verify payment
  //     const receipt = await this.service.verifyPayment(reference);
  //     const subscription = await Subscription.findById(
  //       receipt.subscriptionId
  //     ).select("name");

  //     logger.info(`Payment verified successfully for reference ${reference}`);

  //     // Redirect to frontend with success status
  //     return res.redirect(
  //       `${
  //         config.FRONTEND_URL
  //       }/dashboard/subscriptions?status=success&message=${encodeURIComponent(
  //         "Payment verified successfully! Your subscription has been activated."
  //       )}`
  //     );
  //   } catch (error) {
  //     logger.error(
  //       `Payment callback error for reference ${req.query.reference}: ${error}`
  //     );

  //     // Redirect to frontend with error status
  //     return res.redirect(
  //       `${
  //         config.FRONTEND_URL
  //       }/dashboard/subscriptions?status=error&message=${encodeURIComponent(
  //         "Payment verification failed. Please contact support if money was deducted."
  //       )}`
  //     );
  //   }
  // }
  async handlePaymentCallback(req: Request, res: Response) {
    try {
      const reference = String(req.query.reference || "");
      if (!reference) {
        logger.error("Payment callback missing reference");
        return res.redirect(
          `${
            config.FRONTEND_URL
          }/dashboard/paymenterror?message=${encodeURIComponent(
            "Missing payment reference. Please try again or contact support if you need assistance."
          )}`
        );
      }

      logger.info(`Processing payment callback for reference: ${reference}`);

      const receipt = await this.service.verifyPayment(reference);
      const subscription = await Subscription.findById(
        receipt.subscriptionId
      ).select("name");

      logger.info(`Payment verified successfully for reference ${reference}`);

      return res.redirect(
        `${
          config.FRONTEND_URL
        }/dashboard/paymentsuccess?message=${encodeURIComponent(
          `🎉 Payment successful! Your ${
            subscription?.name || "subscription"
          } is now active and your devices are protected.`
        )}`
      );
    } catch (error) {
      logger.error(
        `Payment callback error for reference ${req.query.reference}: ${error}`
      );

      let errorMessage = "Payment verification failed. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("amount mismatch")) {
          errorMessage =
            "Payment amount verification failed. Please contact support immediately.";
        } else if (error.message.includes("Payment failed")) {
          errorMessage =
            "Your payment was not successful. Please check your payment details and try again.";
        } else if (error.message.includes("User not found")) {
          errorMessage =
            "Account verification failed. Please contact support for assistance.";
        } else if (error.message.includes("Invalid payment reference")) {
          errorMessage =
            "Invalid payment session. Please try again from the beginning.";
        }
      }

      return res.redirect(
        `${
          config.FRONTEND_URL
        }/dashboard/paymenterror?message=${encodeURIComponent(errorMessage)}`
      );
    }
  }
  // UPDATED: Manual verification endpoint (POST request for API calls)
  async verifyPayment(req: Request, res: Response) {
    try {
      const reference = String(req.body.reference || req.query.reference || "");
      if (!reference) throw new BadRequestError("Missing payment reference");

      const receipt = await this.service.verifyPayment(reference);
      const subscription = await Subscription.findById(
        receipt.subscriptionId
      ).select("-_id name");

      logger.info(
        `Manual payment verification completed for reference ${reference}`
      );

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
