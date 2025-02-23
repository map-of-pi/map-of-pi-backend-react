import { Request, Response } from "express";
import { getAllTransactionRecords, processTransaction } from "../services/transaction.service";
import logger from "../config/loggingConfig";

export const getTransactionRecords = async (req: Request, res: Response) => {  
  const { transaction_id } = req.params
  try {
    const records = await getAllTransactionRecords(transaction_id);

    if (!records || records.length === 0) {
      logger.warn(`No records are found for Pioneer: ${transaction_id}`);
      return res.status(404).json({ message: 'Transaction records not found' });
    }
    logger.info(`Fetched ${records.length} transaction records for Pioneer: ${transaction_id}`);
    return res.status(200).json(records);
  } catch (error) {
    logger.error('Failed to fetch transaction records:', error);
    return res.status(500).json({ message: 'An error occurred while fetching transaction records; please try again later' });
  }
};

export const submitTransaction = async (req: Request, res: Response) => {
  const authUser = req.currentUser;
  try {
    if (!authUser) {
      logger.warn('No authenticated user found when trying to submit transaction.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transaction_type, amount, reason } = req.body;

    const newTransactionRecord = await processTransaction(authUser.pi_uid, transaction_type, amount, reason);

    logger.info(`Transaction processed for transaction ID: ${authUser.pi_uid}`);
    return res.status(200).json(newTransactionRecord);
  } catch (error) {
    logger.error('Failed to submit transaction:', error);
    return res.status(500).json({ message: 'An error occurred while submitting transaction; please try again later' });
  }
};