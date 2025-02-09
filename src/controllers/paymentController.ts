import { Request, Response } from "express";
import { validateTxId } from "../utils/payment"
import logger from "../config/loggingConfig";
import { findPaymentByIdAndUser, updatePaymentStatus } from "../services/payment.service";

export const completePayment = async (req: Request, res: Response) => {
    const { paymentId, txId, pi_uid } = req.body;
  
    try {
      // Step 1: Validate input
      if (!paymentId || !txId || !pi_uid) {
        logger.warn("Payment record not found", { paymentId, txId, pi_uid});
        return res.status(400).json({ message: "Payment not found" });
      }
  
      // Step 2: Find the payment record
      const payment = await findPaymentByIdAndUser( paymentId, pi_uid );
      if (!payment || payment.status !== "approved") {
        logger.warn(`Payment exists but it's not approved: ${paymentId}`);
        return res.status(404).json({ message: "Payment not approved" });
      }
  
      // Step 3: Validate txId (optional, if required by Pi SDK)
      const isTxValid = await validateTxId(txId); // Replace with actual validation logic
      if (!isTxValid) {
        logger.warn(`Transaction validation failed: Invalid or unverified transaction ID`, { txId });
        return res.status(400).json({ message: "Invalid or unverified transaction ID" });
      }
  
      // Step 4: Update payment status to 'completed'
      await updatePaymentStatus(paymentId, "completed", txId);
  
      // Step 5: Add post-payment logic
      res.status(200).json({ message: "Payment completed successfully", payment });
    } catch (error) {
      logger.error(`Error completing payment:", { error }`);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  