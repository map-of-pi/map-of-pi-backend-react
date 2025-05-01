import TransactionRecord from "../models/TransactionRecord";
import { TransactionType } from "../models/enums/transactionType";
import { updateMappiBalance } from "./membership.service";
import { ITransactionRecord } from "../types";
import logger from "../config/loggingConfig";

export const getAllTransactionRecords = async (
  transaction_id: string,
): Promise<ITransactionRecord[] | null> => {
  try {
    const existingRecords = await TransactionRecord.find({
      transaction_id
    }) || [];

    if (existingRecords.length == 0) {
      logger.warn('Transaction records list is empty.');     
    } else {
      logger.info('fetched transaction records list successfully');
    } 
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
      await updateMappiBalance(transaction_id, transaction_type, amount);
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

    // Find the existing transaction record by transaction_id
    const existingRecord = await TransactionRecord.findOne({ transaction_id });

    if (existingRecord) {
      // Append new transaction entry to existing array
      existingRecord.transaction_records.push({
        transaction_type,
        date: today,
        reason,
        amount: adjustedAmount,
      });

      const updatedRecord = await existingRecord.save();
      logger.info(`Transaction records updated for transaction ID: ${transaction_id}`);
      return updatedRecord;
    } else {
      // Create a new transaction record if it does not exist
      const newTransactionRecord = new TransactionRecord({
        transaction_id,
        transaction_records: [
          {
            transaction_type,
            date: today,
            reason,
            amount: adjustedAmount,
          },
        ],
      });

      const savedRecord = await newTransactionRecord.save();
      logger.info(`Transaction records initialized for transaction ID: ${transaction_id}`);
      return savedRecord;
    } 
  } catch (error) {
    logger.error(`Failed to create transaction record for transaction ID: ${transaction_id}`, error);
    throw new Error('Failed to create transaction record; please try again later');
  };
};