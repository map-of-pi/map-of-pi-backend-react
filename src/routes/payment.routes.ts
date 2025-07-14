import { Router } from "express";
import { 
  onIncompletePaymentFound, 
  onPaymentApproval, 
  onPaymentCancellation, 
  onPaymentCompletion,
  onPaymentError
} from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";
import { onPaymentInitiation } from "../controllers/paymentController";

const paymentsRouter = Router();

paymentsRouter.post("/initiate", verifyToken, onPaymentInitiation);
paymentsRouter.post("/incomplete", onIncompletePaymentFound);
paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/approve", verifyToken, onPaymentApproval);
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);
paymentsRouter.post("/error", onPaymentError);

export default paymentsRouter;