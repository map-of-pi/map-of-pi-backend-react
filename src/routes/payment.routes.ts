// src/routes/paymentRoutes.ts

import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as paymentController from "../controllers/paymentController";

const paymentRoutes = express.Router();

/**
 * @swagger
 * /api/v1/payments/initiate:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Initiate a new payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/PaymentsSchema.yml#/components/schemas/InitiatePaymentRq'
 *     responses:
 *       201:
 *         description: Payment initiated
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
paymentRoutes.post("/initiate", verifyToken, paymentController.onPaymentInitiation);

/**
 * @swagger
 * /api/v1/payments/approve:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Approve a pending payment
 */
paymentRoutes.post("/approve", verifyToken, paymentController.onPaymentApproval);

/**
 * @swagger
 * /api/v1/payments/complete:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Complete an approved payment
 */
paymentRoutes.post("/complete", verifyToken, paymentController.onPaymentCompletion);

/**
 * @swagger
 * /api/v1/payments/cancel:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Cancel a pending payment
 */
paymentRoutes.post("/cancel", verifyToken, paymentController.onPaymentCancellation);

export default paymentRoutes;
