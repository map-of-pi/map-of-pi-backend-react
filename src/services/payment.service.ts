import Payment from "../models/payment";
import logger from "../config/loggingConfig";

// Retrieve a payment record by paymentId and user ID
export const findPaymentByIdAndUser = async (paymentId: string, pi_uid: string) => {
  try { 
  return await Payment.findOne({ paymentId, pi_uid });
  } catch (error) {
    logger.error("Error finding payment by ID and user", { paymentId, pi_uid, error });
    throw error;
  }
};

// Update the status of a payment, optionally including the transaction ID
export const updatePaymentStatus = async (
  paymentId: string,
  status: "pending" | "approved" | "completed" | "failed",
  txId?: string
) => {
  try {
  const updateFields: { status: string; txId?: string } = { status };
  if (txId) updateFields.txId = txId;

  return await Payment.findOneAndUpdate({ paymentId }, updateFields, { new: true });
  } catch (error){
    logger.error("Error updating payment status", { paymentId, status, txId, error });
  }
};

// Create a new payment record in the database
export const createPayment = async (paymentData: {
  paymentId: string;
  pi_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  status?: "pending" | "approved" | "completed" | "failed";
}) => {
  try {
  return await Payment.create(paymentData);
  } catch (error) {
    logger.error("Error creating payment", { paymentData, error });
  }
};
