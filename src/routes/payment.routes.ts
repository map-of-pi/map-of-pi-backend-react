// Payments endpoint under /payments:
import { Router } from "express";
import { onIncompletePaymentFound, onPaymentApproval, onPaymentCancellation, onPaymentCompletion, onSubmitPayment } from "../controllers/payment";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/incomplete",onIncompletePaymentFound);
paymentsRouter.post("/approve",verifyToken,  onPaymentApproval);
paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/cancelled_payment", onPaymentCancellation);

// paymentsRouter.post("/submit_payment",verifyToken, onSubmitPayment)


export default paymentsRouter


