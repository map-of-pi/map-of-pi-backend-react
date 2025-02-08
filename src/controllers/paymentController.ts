import { Request, Response } from "express";
import Payment from "../models/payment"
import { validateTxId } from "../utils/payment"

export const completePayment = async (req: Request, res: Response) => {
    const { paymentId, txId, pi_uid } = req.body;
  
    try {
      // Step 1: Validate input
      if (!paymentId || !txId || !pi_uid) {
        console.warn("Invalid request data:", { paymentId, txId, pi_uid });
        return res.status(400).json({ message: "Invalid request data" });
      }
  
      // Step 2: Find the payment record
      const payment = await Payment.findOne({ paymentId, pi_uid });
      if (!payment || payment.status !== "approved") {
        console.warn(`Payment not found or not approved for paymentId: ${paymentId}`);
        return res.status(404).json({ message: "Payment not found or not approved" });
      }
  
      // Step 3: Validate txId (optional, if required by Pi SDK)
      const isTxValid = await validateTxId(txId); // Replace with actual validation logic
      if (!isTxValid) {
        console.warn(`Invalid or unverified transaction ID: ${txId}`);
        return res.status(400).json({ message: "Invalid or unverified transaction ID" });
      }
  
      // Step 4: Update payment status to 'completed'
      payment.status = "completed";
      payment.txId = txId;
      await payment.save();
  
      // Step 5: Add post-payment logic (optional)
      res.status(200).json({ message: "Payment completed successfully", payment });
    } catch (error) {
      console.error("Error completing payment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  