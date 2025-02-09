import TransactionRecord from "../models/TransactionRecord";
import { TransactionType } from "../models/enums/transactionType";
import { updateMembershipBalance } from "./membership.service";
import { ITransactionRecord } from "../types";
import logger from "../config/loggingConfig";

// Submit a transaction
export const submitTransaction = async (
  transaction_id: string,
  transaction_type: TransactionType,
  amount: number,
  reason: string,
) => {
  try {
    // Create the transaction record
    const transactionRecord = await createTransactionRecord(transaction_id, transaction_type, amount, reason);

    // If the transaction type is Mappi then update the associated Membership record
    if ([TransactionType.MAPPI_WITHDRAWAL, TransactionType.MAPPI_DEPOSIT].includes(transaction_type)) {
      await updateMembershipBalance(transaction_id, amount);
    }

    logger.info(`Transaction submitted successfully for membershipID: ${transaction_id}`);
    return { success: true, message: 'Transaction submitted successfully' };
  } catch (error) {
    logger.error(`Failed to submit transaction for membershipID: ${transaction_id}`, error);
    throw new Error('Failed to submit transaction; please try again later');
  }
};

// Create a transaction record for the given amount
export const createTransactionRecord = async(
  transaction_id: string,
  transaction_type: TransactionType, 
  amount: number, 
  reason: string
 ) => {
  const today = new Date();

  try {
    // Adjust the amount based on whether it's a deposit or withdrawal
    const adjustedAmount = 
      [TransactionType.MAPPI_WITHDRAWAL, TransactionType.PI_WITHDRAWAL].includes(transaction_type)
        ? -Math.abs(amount) // Ensure it's negative for withdrawals
      : [TransactionType.MAPPI_DEPOSIT, TransactionType.PI_DEPOSIT].includes(transaction_type)
        ? Math.abs(amount) // Ensure it's positive for deposits
      : 0; // Fallback for invalid transaction types

    // Handle invalid transaction type
    if (adjustedAmount === 0) {
      throw new Error(`Invalid transaction type: ${transaction_type}`);
    }  

    const transactionRecord = new TransactionRecord({
      mappi_transaction_id: transaction_id, // Use the membership_id as the transaction ID
      mappi_record: [
        {
          transaction_type: transaction_type,
          date: today,
          reason: reason,
          amount: adjustedAmount,
        },
      ],
    });

    const newTransactionRecord = await transactionRecord.save();
    logger.info(`Transaction record created for transaction ID: ${transaction_id}:`, transactionRecord);
    return newTransactionRecord as ITransactionRecord;
  } catch (error) {
    logger.error(`Failed to create transaction record for transaction ID: ${transaction_id}`, error);
    throw new Error('Failed to create transaction record; please try again later');
  };
}