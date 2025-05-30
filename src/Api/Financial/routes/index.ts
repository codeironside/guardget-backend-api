import { Router } from "express";
import { authenticate } from "@/core/middleware/authmiddleware";
import { PaymentController } from "../services";
import { getReceiptsForUsers } from "../services/get.all.receipt";
import { getOneReceiptForUser } from "../services/get.one.payment";

export const financialRouter = Router();
const paymentController = new PaymentController();

// Routes that require authentication
// financialRouter.use("/initialize", authenticate);
// financialRouter.use("/verify", authenticate);
// financialRouter.use("/getallreceiptforuser", authenticate);
// financialRouter.use("/getoneforuser", authenticate);

// Payment initialization (requires auth)
financialRouter.post(
  "/initialize", authenticate,
  paymentController.initializePayment.bind(paymentController)
);

// Paystack callback endpoint (NO AUTH - Paystack calls this directly)
// This is where Paystack redirects users after payment
financialRouter.get(
  "/callback",
  paymentController.handlePaymentCallback.bind(paymentController)
);

// Manual payment verification (requires auth - for API calls)
financialRouter.post(
  "/verify",
  authenticate,
  paymentController.verifyPayment.bind(paymentController)
);

// Receipt routes (require auth)
financialRouter.get("/getallreceiptforuser", authenticate, getReceiptsForUsers);
financialRouter.get("/getoneforuser/:id", authenticate, getOneReceiptForUser);
