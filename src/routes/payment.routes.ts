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

/**
 * @swagger
 * /api/v1/payments/pending-server-payments:
 *   get:
 *     tags:
 *       - Payment
 *     summary: get pending Pi Network payment
 *     description: Get list of all ongoing Pi payment in the blockchain.
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Payment Listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment Listed with id PKBeQbgc9clemz0h7sPmFK8OsvRA
 *                 result:
 *                   type: object
 *                   description: Details of the completed payment
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
paymentsRouter.get("/pending-server-payments", getPendingServerPayments);

/**
 * @swagger
 * /api/v1/payments/completeOrCancelOngoingPayment:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Complete or Cancel a Pi Network payment
 *     description: Completes or cancels an ongoing Pi payment in the blockchain.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: PKBeQbgc9clemz0h7sPmFK8OsvRA
 *                 description: Unique ID of the Pi payment to complete or cancel
 *               txid:
 *                 type: string
 *                 example: 0d367ba3a2e8438086c3ab7c0b7890ct
 *                 description: Blockchain transaction ID confirming the payment; if omitted, payment will be cancelled.
 *     responses:
 *       200:
 *         description: Payment completed or cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment completed with id PKBeQbgc9clemz0h7sPmFK8OsvRA
 *                 result:
 *                   type: object
 *                   description: Details of the completed payment
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
paymentsRouter.post("/completeOrCancelOngoingPayment", onPaymentOngoingToCompleteOrCancel);

export default paymentsRouter;
