import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as transactionController from "../controllers/transactionController";

const transactionRoutes = express.Router();

/**
 * @swagger
 * /api/v1/transactions/use-mappi:
 *   put:
 *     tags:
 *       - Membership
 *     summary: Add or deduct Mappi points from the user's Mappi balance *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/TransactionsSchema.yml#/components/schemas/SubmitMappiTransactionRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/TransactionsSchema.yml#/components/schemas/SubmitMappiTransactionRs'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
transactionRoutes.put(
  "/use-mappi",
  verifyToken,
  transactionController.submitTransaction
);

export default transactionRoutes;