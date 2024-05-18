import { Router } from "express";
import * as paymentController from "../controllers/paymentController";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const paymentRoutes = Router();
paymentRoutes.post(
  "/incomplete",
  isAuthenticated,
  paymentController.onIncompletePaymentFound
);

paymentRoutes.post(
  "/approve",
  isAuthenticated,
  paymentController.onPaymentApproval
);

paymentRoutes.post(
  "/complete",
  isAuthenticated,
  paymentController.onPaymentCompletion
);

paymentRoutes.post(
  "/cancelled_payment",
  isAuthenticated,
  paymentController.onPaymentCancellation
);

export default paymentRoutes;
