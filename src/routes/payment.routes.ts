// Payments endpoint under /payments:
import { Router } from "express";
import { onIncompletePaymentFound, onPaymentApproval, onPaymentCancellation, onPaymentCompletion } from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/incomplete",onIncompletePaymentFound);
paymentsRouter.post("/approve",verifyToken,  onPaymentApproval);
paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/cancelled_payment", onPaymentCancellation);

export default paymentsRouter


