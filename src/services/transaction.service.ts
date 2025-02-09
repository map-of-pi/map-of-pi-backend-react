import TransactionRecord from "../models/TransactionRecord";
import { TransactionType } from "../models/enums/transactionType";
import { updateMembershipBalance } from "./membership.service";
import { ITransactionRecord } from "../types";
import logger from "../config/loggingConfig";

export const getAllTransactionRecords = async (
  transaction_id: string,
): Promise<ITransactionRecord[] | null> => {
  try {
    const existingRecords = await TransactionRecord.find({
      transaction_id
    });

    if (!existingRecords || existingRecords.length == 0) {
      logger.warn('Transaction records list is empty.');
      return null;      
    } 
    logger.info('fetched transaction records list successfully');
    return existingRecords as ITransactionRecord[];
  } catch (error) {
    logger.error(`Failed to get transaction records for transaction ID: ${ transaction_id }`, error);
    throw new Error('Failed to get transaction records; please try again later');
  }
};

// Process transaction
export const processTransaction = async (
  transaction_id: string,
  transaction_type: TransactionType,
  amount: number,
  reason: string,
): Promise<ITransactionRecord> => {
  try {
    // Validate transaction type early
    if (!Object.values(TransactionType).includes(transaction_type)) {
      throw new Error(`Invalid transaction type: ${transaction_type}`);
    }

    // Create the transaction record
    const transactionRecord = await createTransactionRecord(transaction_id, transaction_type, amount, reason);

    // Update membership balance for Mappi transactions
    if ([TransactionType.MAPPI_WITHDRAWAL, TransactionType.MAPPI_DEPOSIT].includes(transaction_type)) {
      await updateMembershipBalance(transaction_id, amount);
    }

    logger.info(`Transaction submitted successfully for transaction ID: ${transaction_id}`);
    return transactionRecord;
  } catch (error) {
    logger.error(`Failed to submit transaction for transaction ID: ${transaction_id}`, error);
    throw new Error('Failed to submit transaction; please try again later');
  }
};

// Create a transaction record for the given amount
export const createTransactionRecord = async(
  transaction_id: string,
  transaction_type: TransactionType, 
  amount: number, 
  reason: string
 ): Promise<ITransactionRecord> => {
  const today = new Date();

  try {
    // Adjust the amount based on transaction type
    const adjustedAmount = 
      [TransactionType.MAPPI_WITHDRAWAL, TransactionType.PI_WITHDRAWAL].includes(transaction_type)
        ? -Math.abs(amount)
        : Math.abs(amount);

    const transactionRecord = new TransactionRecord({
      transaction_id,
      transaction_record: [
        {
          transaction_type,
          date: today,
          reason,
          amount: adjustedAmount,
        },
      ],
    });

    const newTransactionRecord = await transactionRecord.save();
    logger.info(`Transaction record created for transaction ID: ${transaction_id}:`, transactionRecord);
    return newTransactionRecord;
  } catch (error) {
    logger.error(`Failed to create transaction record for transaction ID: ${transaction_id}`, error);
    throw new Error('Failed to create transaction record; please try again later');
  };
}