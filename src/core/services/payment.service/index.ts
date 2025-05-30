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

const PAYSTACK_SECRET_KEY = config.PAYSTACK_SECRET_KEY!;

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
    callbackUrl: string // Add callback URL parameter
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const reference = uuidv4();

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          amount: amount * 100, // Paystack expects amount in kobo
          email,
          reference,
          callback_url: callbackUrl, // Add callback URL to Paystack request
          metadata: {
            userId: userId.toString(),
            duration,
            durationUnit,
            subId: subId.toString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Store payment session for verification
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
        `Payment session created with callback URL: ${callbackUrl}, reference: ${reference}`
      );

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference,
      };
    } catch (error) {
      logger.error(`Payment initialization failed: ${error}`);
      throw new BadRequestError("Failed to initialize payment");
    }
  }

  // Keep your existing verifyPayment method - no changes needed
  async verifyPayment(
    reference: string
  ): Promise<HydratedDocument<ReceiptModel>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentSession = this.paymentSessions.get(reference);
      if (!paymentSession) {
        throw new BadRequestError("Invalid payment reference");
      }

      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (verification.data.data.status !== "success") {
        paymentSession.status = "failed";
        await session.abortTransaction();
        throw new BadRequestError("Payment failed");
      }

      const user = await User.findById(paymentSession.userId).session(session);
      if (!user) {
        throw new BadRequestError("User not found");
      }

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

      const baseDate =
        user.subActiveTill && user.subActiveTill > new Date()
          ? user.subActiveTill
          : new Date();

      const expiry = new Date(baseDate);
      if (paymentSession.durationUnit === "months") {
        expiry.setMonth(expiry.getMonth() + paymentSession.duration);
      } else {
        expiry.setFullYear(expiry.getFullYear() + paymentSession.duration);
      }

      user.subActive = true;
      user.subActiveTill = expiry;
      user.subId = paymentSession.subId;
      await user.save({ session });

      this.paymentSessions.delete(reference);
      await session.commitTransaction();

      return receipt;
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Payment verification failed: ${error}`);
      throw new BadRequestError(
        error instanceof Error ? error.message : "Payment verification failed"
      );
    } finally {
      session.endSession();
    }
  }
}
