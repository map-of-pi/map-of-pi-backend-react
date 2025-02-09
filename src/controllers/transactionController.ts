import { Request, Response } from "express";
import { createTransactionRecord } from "../services/transaction.service";
import logger from "../config/loggingConfig";

export const submitTransaction = async (req: Request, res: Response) => {
  const authUser = req.currentUser;
  try {
    if (!authUser) {
      logger.warn('No authenticated user found when trying to submit transaction.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transaction_type, amount, reason } = req.body;

    const newTransactionRecord = await createTransactionRecord(authUser.pi_uid, transaction_type, amount, reason);

    logger.info(`Mappi transaction processed for membershipID: ${authUser.pi_uid}`);
    return res.status(200).json( { transactionRecord: newTransactionRecord });
  } catch (error) {
    logger.error('Failed to submit Mappi Transaction:', error);
    return res.status(500).json({ message: 'An error occurred while submitting the Mappi Transaction; please try again later' });
  }
};