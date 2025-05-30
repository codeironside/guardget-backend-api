import { HydratedDocument } from "mongoose";
import { User } from "@/Api/Users/model/users";
import { Receipt } from "@/Api/Financial/model";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { BadRequestError } from "@/core/error";
import logger from "@/core/logger";
import { config } from "@/core/utils/config";
import { ReceiptModel } from "@/Api/Financial/interfaces";

// Debug: Log the secret key (remove in production)
const PAYSTACK_SECRET_KEY = config.PAYSTACK_SECRET_KEY!;
console.log("Paystack Secret Key exists:", !!PAYSTACK_SECRET_KEY);
console.log(
  "Paystack Secret Key starts with sk_:",
  PAYSTACK_SECRET_KEY?.startsWith("sk_")
);

interface PaymentSession {
  userId: mongoose.Types.ObjectId;
  subId: mongoose.Types.ObjectId;
  duration: number;
  durationUnit: "months" | "years";
  amount: number;
  reference: string;
  status: "pending" | "completed" | "failed";
}

export class PaymentService {
  private paymentSessions = new Map<string, PaymentSession>();

  async initializePayment(
    userId: mongoose.Types.ObjectId,
    subId: mongoose.Types.ObjectId,
    duration: number,
    durationUnit: "months" | "years",
    amount: number,
    email: string,
    callbackUrl: string
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = uuidv4();

    // Validation checks
    if (!PAYSTACK_SECRET_KEY) {
      throw new BadRequestError("Paystack secret key not configured");
    }

    if (!PAYSTACK_SECRET_KEY.startsWith("sk_")) {
      throw new BadRequestError("Invalid Paystack secret key format");
    }

    if (amount <= 0) {
      throw new BadRequestError("Invalid payment amount");
    }

    if (!email || !email.includes("@")) {
      throw new BadRequestError("Invalid email address");
    }

    try {
      const payload = {
        amount: Math.round(amount * 100),
        email: email.trim(),
        reference,
        callback_url: callbackUrl,
        currency: "NGN", // Explicitly set currency
        metadata: {
          userId: userId.toString(),
          duration: duration.toString(),
          durationUnit,
          subId: subId.toString(),
        },
      };

      logger.info(
        `Initializing payment - Reference: ${reference}, Amount: ₦${amount}, Email: ${email}, Callback: ${callbackUrl}`
      );

      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        payload,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Check if response is successful
      if (!response.data || !response.data.status) {
        throw new BadRequestError("Invalid response from Paystack");
      }

      if (!response.data.data?.authorization_url) {
        throw new BadRequestError(
          "No authorization URL received from Paystack"
        );
      }

      this.paymentSessions.set(reference, {
        userId,
        subId,
        duration,
        durationUnit,
        amount,
        reference,
        status: "pending",
      });

      logger.info(
        `Payment session created successfully - Reference: ${reference}, Authorization URL: ${response.data.data.authorization_url}`
      );

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference,
      };
    } catch (error: any) {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
        };

        logger.error(
          `Paystack API Error - Status: ${errorDetails.status}, Message: ${
            errorDetails.message
          }, Data: ${JSON.stringify(errorDetails.data)}`
        );

        if (error.response?.status === 401) {
          throw new BadRequestError(
            "Invalid Paystack credentials. Please check your secret key."
          );
        }

        if (error.response?.status === 400) {
          const errorMessage =
            error.response?.data?.message || "Invalid request to Paystack";
          throw new BadRequestError(
            `Paystack validation error: ${errorMessage}`
          );
        }

        if (error.response?.status === 422) {
          const errors = error.response?.data?.errors || {};
          const errorMessages = Object.values(errors).flat().join(", ");
          throw new BadRequestError(
            `Paystack validation failed: ${errorMessages}`
          );
        }
      }

      logger.error(
        `Payment initialization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new BadRequestError(
        "Failed to initialize payment. Please try again."
      );
    }
  }

  async verifyPayment(
    reference: string
  ): Promise<HydratedDocument<ReceiptModel>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if payment session exists
      const paymentSession = this.paymentSessions.get(reference);
      if (!paymentSession) {
        await session.abortTransaction();
        throw new BadRequestError("Invalid payment reference");
      }

      logger.info(`Starting payment verification for reference: ${reference}`);

      // Verify transaction with Paystack
      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const transactionData = verification.data.data;
      logger.info(
        `Paystack verification response for ${reference}: ${transactionData.status}`
      );

      // Check if payment was successful
      if (transactionData.status !== "success") {
        paymentSession.status = "failed";
        await session.abortTransaction();

        const gatewayResponse =
          transactionData.gateway_response || "Payment was not successful";
        logger.warn(
          `Payment unsuccessful for ${reference}: ${gatewayResponse}`
        );

        throw new BadRequestError(`Payment failed: ${gatewayResponse}`);
      }

      // Verify payment amount matches expected amount
      const expectedAmount = Math.round(paymentSession.amount * 100);
      if (transactionData.amount !== expectedAmount) {
        await session.abortTransaction();
        logger.error(
          `Amount mismatch for ${reference}: Expected ${expectedAmount}, got ${transactionData.amount}`
        );
        throw new BadRequestError("Payment amount mismatch");
      }

      // Find the user who made the payment
      const user = await User.findById(paymentSession.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        logger.error(
          `User not found for payment ${reference}: ${paymentSession.userId}`
        );
        throw new BadRequestError("User not found");
      }

      // Create payment receipt
      const [receipt] = await Receipt.create(
        [
          {
            amount: paymentSession.amount,
            date: new Date(),
            description: `Subscription payment for ${paymentSession.duration} ${paymentSession.durationUnit}`,
            status: "completed",
            receiptNumber: reference,
            userId: paymentSession.userId,
            duration: paymentSession.duration,
            subscriptionId: paymentSession.subId,
            durationUnit: paymentSession.durationUnit,
          },
        ],
        { session }
      );

      // Calculate subscription expiry date
      const currentDate = new Date();
      const baseDate =
        user.subActiveTill && user.subActiveTill > currentDate
          ? user.subActiveTill
          : currentDate;

      const expiryDate = new Date(baseDate);
      if (paymentSession.durationUnit === "months") {
        expiryDate.setMonth(expiryDate.getMonth() + paymentSession.duration);
      } else if (paymentSession.durationUnit === "years") {
        expiryDate.setFullYear(
          expiryDate.getFullYear() + paymentSession.duration
        );
      }

      // Update user subscription
      user.subActive = true;
      user.subActiveTill = expiryDate;
      user.subId = paymentSession.subId;
      await user.save({ session });

      // Clean up payment session and commit transaction
      this.paymentSessions.delete(reference);
      await session.commitTransaction();

      logger.info(
        `Payment verification completed successfully - Reference: ${reference}, User: ${
          user._id
        }, Amount: ₦${
          paymentSession.amount
        }, Expires: ${expiryDate.toISOString()}`
      );

      return receipt;
    } catch (error) {
      // Rollback transaction on any error
      await session.abortTransaction();

      if (axios.isAxiosError(error)) {
        logger.error(
          `Paystack API error for ${reference}: Status ${error.response?.status}, Message: ${error.message}`
        );

        if (error.response?.status === 404) {
          throw new BadRequestError("Payment reference not found");
        } else if (error.response?.status === 401) {
          throw new BadRequestError("Payment verification system error");
        } else {
          throw new BadRequestError(
            "Payment verification failed - external service error"
          );
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : "Payment verification failed";
      logger.error(
        `Payment verification failed for ${reference}: ${errorMessage}`
      );

      throw new BadRequestError(errorMessage);
    } finally {
      // Always end the session
      await session.endSession();
    }
  }
}
