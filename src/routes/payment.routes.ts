import { Router } from "express";
import { 
  getPendingServerPayments,
  onIncompletePaymentFound, 
  onPaymentApproval, 
  onPaymentCancellation, 
  onPaymentCompletion,
  onPaymentError,
  onPaymentOngoingToCompleteOrCancel
} from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";

const paymentsRouter = Router();

paymentsRouter.post("/incomplete", onIncompletePaymentFound);
paymentsRouter.post("/complete", onPaymentCompletion);
paymentsRouter.post("/approve", verifyToken, onPaymentApproval);
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);
paymentsRouter.post("/error", onPaymentError);

/* Experimental Pi Payment APIs */
paymentsRouter.get("/pendingPayments", getPendingServerPayments);
paymentsRouter.post("/completeOrCancelOngoingPayment", onPaymentOngoingToCompleteOrCancel);

export default paymentsRouter;