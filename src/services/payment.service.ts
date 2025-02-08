import Payment from "../models/payment";

// Retrieve a payment record by paymentId and user ID
export const findPaymentByIdAndUser = async (paymentId: string, pi_uid: string) => {
  try { 
  return await Payment.findOne({ paymentId, pi_uid });
  } catch (error) {
    throw error;
  }
};

// Update the status of a payment, optionally including the transaction ID
export const updatePaymentStatus = async (
  paymentId: string,
  status: "pending" | "approved" | "completed" | "failed",
  txId?: string
) => {
  const updateFields: { status: string; txId?: string } = { status };
  if (txId) updateFields.txId = txId;

  return await Payment.findOneAndUpdate({ paymentId }, updateFields, { new: true });
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
  return await Payment.create(paymentData);
};
