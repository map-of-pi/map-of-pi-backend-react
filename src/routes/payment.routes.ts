import { Router } from "express";
import { 
  onIncompletePaymentFound, 
  onPaymentApproval, 
  onPaymentCancellation, 
  onPaymentCompletion,
  onPaymentError
} from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/incomplete", verifyToken, onIncompletePaymentFound);
paymentsRouter.post("/complete", verifyToken, onPaymentCompletion);
paymentsRouter.post("/approve", verifyToken, onPaymentApproval);
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);
paymentsRouter.post("/error", verifyToken, onPaymentError);

export default paymentsRouter;