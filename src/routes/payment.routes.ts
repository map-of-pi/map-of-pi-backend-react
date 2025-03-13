import { Router } from "express";
import { onIncompletePaymentFound, onPaymentApproval, onPaymentCancellation, onPaymentCompletion } from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/incomplete", onIncompletePaymentFound);
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);
paymentsRouter.post("/approve",verifyToken, onPaymentApproval);

export default paymentsRouter;
