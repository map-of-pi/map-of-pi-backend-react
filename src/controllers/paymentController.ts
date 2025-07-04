import { Request, Response } from "express";
import logger from "../config/loggingConfig";
import { 
  processIncompletePayment, 
  processPaymentApproval, 
  processPaymentCancellation, 
  processPaymentCompletion,
  processPaymentError
} from "../helpers/payment";
import { IUser } from "../types";
import { getIncompleteServerPayments } from "../services/payment.service";
import pi from "../config/platformAPIclient";

export const onIncompletePaymentFound = async (req: Request, res: Response) => {
 const { payment } = req.body;
  try {
    const processedPayment = await processIncompletePayment(payment);
    return res.status(200).json(processedPayment);
  } catch (error) {
    logger.error(`Failed to process incomplete payment for paymentID ${ payment.identifier }:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while processing incomplete payment; please try again later' 
    });
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser as IUser;
  const { paymentId } = req.body;
  try {
    const approvedPayment = await processPaymentApproval(paymentId, currentUser);
    return res.status(200).json(approvedPayment);
  } catch (error) {
    logger.error(`Failed to approve Pi payment for piPaymentID ${ paymentId }:`, error);
    return res.status(500).json({
      success: false, 
      message: 'An error occurred while approving Pi payment; please try again later' 
    });
  }
};

export const onPaymentCompletion = async (req: Request, res: Response) => {
  const { paymentId, txid } = req.body;
  try {
    const completedPayment = await processPaymentCompletion(paymentId, txid);
    return res.status(200).json(completedPayment);
  } catch (error) {
    logger.error(`Failed to complete Pi payment for paymentID ${ paymentId } | txID ${ txid }:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while completing Pi payment; please try again later',
    });
  }
};

export const onPaymentCancellation = async (req: Request, res: Response) => {
  const { paymentId } = req.body;
  try {
    const cancelledPayment = await processPaymentCancellation(paymentId);
    return res.status(200).json(cancelledPayment);
  } catch (error) {
    logger.error(`Failed to cancel Pi payment for paymentID ${ paymentId }:`, error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling Pi payment; please try again later',
    });
  }
};

export const onPaymentError = async (req: Request, res: Response) => {
  const { paymentDTO, error } = req.body;
  logger.error(`Error processing Pi payment:`, error);
  try {
    if (!paymentDTO){
      return res.status(400).json({
        success: true,
        message: `No payment Data is found for error: ${error}`
      })
    }
    const result = processPaymentError(paymentDTO);
    return res.status(500).json(result);
  } catch (error) {
    logger.error(`Error handling failed:`, error);
    return res.status(500).json({
      success: false,
      message: 'Pi payment error handling failed',
    });
  } 
 
}

export const getPendingServerPayments = async (req: Request, res: Response) => {
  try {
    const servverPayments = await getIncompleteServerPayments();
    return res.status(200).json(servverPayments);
  } catch (error) {
    logger.error('Failed to fetch pending server payments:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching pending server payments; please try again later',
    });
  }
}

export async function onPaymentOngoingToCompleteOrCancel(req: Request, res: Response) {
  const { paymentId, txid } = req.body;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: "paymentId is required",
    });
  }

  try {
    let result;

    if (txid) {
      // Complete the payment with the transaction ID
      result = await pi.completePayment(paymentId, txid);
      return res.status(200).json({
        success: true,
        message: `Payment completed with id ${paymentId},
        result`,
      });
    } else {
      // No txid means cancel the payment
      result = await pi.cancelPayment(paymentId);
      return res.status(200).json({
        success: true,
        message: `Payment cancelled with id ${paymentId},
        result`,
      });
    }
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}