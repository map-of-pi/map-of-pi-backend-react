import { Router } from "express";
import { 
  onIncompletePaymentFound, 
  onPaymentApproval, 
  onPaymentCancellation, 
  onPaymentCompletion 
} from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentSchema:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           description: Unique ID of the user
 *         pi_payment_id:
 *           type: string
 *           description: Unique ID of the Pi payment
 *         txid:
 *           type: string
 *           description: Unique ID of the Pi payment transaction
 *         amount:
 *           type: object
 *           description: Pi currency amount being transferred
 *           properties:
 *             $numberDecimal:
 *               type: string
 *           required:
 *             - $numberDecimal
 *         paid:
 *           type: boolean
 *           description: Determine if the Pi payment is successfully completed
 *         cancelled:
 *           type: boolean
 *           description: Determine if the Pi transaction is cancelled
 *         memo:
 *           type: string
 *           description: Optional explanation of the Pi transaction reference
 *         payment_type:
 *           $ref: '/api/docs/enum/PaymentType.yml#/components/schemas/PaymentType'
 */
const paymentsRouter = Router();

/**
 * @swagger
 * /api/v1/payments/incomplete:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Process an incomplete Pi Network payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/PaymentsSchema.yml#/components/schemas/PaymentInfoRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   example: Payment completed from incomplete payment with id 0d367ba3a2e8438086c3ab7c0b7890c0
 *                   description: Informational message about the payment-related outcome
 *       500:
 *         description: Internal server error
 */ 
paymentsRouter.post("/incomplete", onIncompletePaymentFound);

/**
 * @swagger
 * /api/v1/payments/complete:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Complete a Pi Network payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: 0d367ba3a2e8438086c3ab7c0b7890c0
 *                 description: Unique ID of the Pi payment
 *               txid:
 *                 type: string
 *                 example: 0d367ba3a2e8438086c3ab7c0b7890ct
 *                 description: Unique ID of the Pi payment transaction
 *             required:
 *               - paymentId
 *               - txid
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   example: Payment completed with id 0d367ba3a2e8438086c3ab7c0b7890c0
 *                   description: Informational message about the payment-related outcome
 *       500:
 *         description: Internal server error
 */ 
paymentsRouter.post("/complete", onPaymentCompletion);

/**
 * @swagger
 * /api/v1/payments/approve:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Approve a Pi Network payment *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: 0d367ba3a2e8438086c3ab7c0b7890c0
 *                 description: Unique ID of the Pi payment
 *             required:
 *               - paymentId
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   example: Payment approved with id 0d367ba3a2e8438086c3ab7c0b7890c0
 *                   description: Informational message about the payment-related outcome
 *       500:
 *         description: Internal server error
 */ 
paymentsRouter.post("/approve", verifyToken, onPaymentApproval);

/**
 * @swagger
 * /api/v1/payments/cancelled-payment:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Cancel a Pi Network payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: 0d367ba3a2e8438086c3ab7c0b7890c0
 *                 description: Unique ID of the Pi payment
 *             required:
 *               - paymentId
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates whether the operation was successful
 *                 message:
 *                   type: string
 *                   example: Payment cancelled with id 0d367ba3a2e8438086c3ab7c0b7890c0
 *                   description: Informational message about the payment-related outcome
 *       500:
 *         description: Internal server error
 */ 
paymentsRouter.post("/cancelled-payment", onPaymentCancellation);

export default paymentsRouter;
