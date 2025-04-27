import { Router } from "express";
import { authenticate } from "@/core/middleware/authmiddleware";
import { PaymentController } from "../services";
import { getReceiptsForUsers } from "../services/get.all.receipt";
import { getOneReceiptForUser } from "../services/get.one.payment";

export const financialRouter = Router();
const paymentController = new PaymentController();
financialRouter.use(authenticate)

financialRouter.post(
  "/payments/initialize",
  paymentController.initializePayment.bind(paymentController)
);

financialRouter.post(
  "/payments/callback",
  paymentController.handlePaymentCallback.bind(paymentController)
);
financialRouter.get("/getallreceiptforuser", getReceiptsForUsers);

financialRouter.get("/getoneforuser", getOneReceiptForUser)

       