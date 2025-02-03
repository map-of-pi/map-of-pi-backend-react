import { Request, Response } from "express";
import logger from "../config/loggingConfig";

export const submitMappiTransaction = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    if (!authUser) {
      logger.warn('User not found; Mappi Transaction failed to submit');
      return res.status(404).json({ message: 'User not found: Mappi Transaction failed to submit' });
    }

    // TODO - if type is add then go to add service layer, if type is deduct then go to deduct service layer.

    const membership_id = authUser.pi_uid;

    return res.status(200).json({ });

  } catch (error) {
    logger.error('Failed to submit Mappi Transaction:', error);
    return res.status(500).json({ message: 'An error occurred while submitting the Mappi Transaction; please try again later' });
  }
};