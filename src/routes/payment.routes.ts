import { Router } from "express";
import { 
  onIncompletePaymentFound, 
  onPaymentApproval, 
  onPaymentCancellation, 
  onPaymentCompletion 
} from "../controllers/orderPaymentController";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/incomplete", onIncompletePaymentFound);
paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/approve",verifyToken, onPaymentApproval);
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);

export default paymentsRouter;
