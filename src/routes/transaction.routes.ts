import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import * as transactionController from "../controllers/transactionController";

const transactionRoutes = express.Router();

/**
 * @swagger
 * /api/v1/transactions/{transaction_id}:
 *   get:
 *     tags:
 *       - Transaction
 *     summary: Get transaction records associated with the transaction ID
 *     parameters:
 *       - name: transaction_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pi UID of the transaction record to retrieve
 *     responses:
 *       204:
 *         description: Transaction records not found
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/TransactionsSchema.yml#/components/schemas/GetTransactionRecordsRs'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
transactionRoutes.get("/:transaction_id", transactionController.getTransactionRecords);

/**
 * @swagger
 * /api/v1/transactions/submit:
 *   post:
 *     tags:
 *       - Transaction
 *     summary: Submit Mappi or Pi transaction to update balance *
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
transactionRoutes.post(
  "/submit",
  verifyToken,
  transactionController.submitTransaction
);

export default transactionRoutes;