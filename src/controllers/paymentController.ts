import { Request, Response } from "express";
import logger from "../config/loggingConfig";
import {
  processIncompletePayment, 
  processPaymentApproval, 
  processPaymentCancellation, 
  processPaymentCompletion
} from "../helpers/payment";
import { IUser, PaymentDataType } from "../types";
import { createU2APayment } from "../services/payment.service";

export const onPaymentInitiation = async (req: Request, res: Response) => {
  try {
    const currentUser = req.currentUser as IUser;
    const paymentData = req.body as PaymentDataType;

    const { memo, amount, metadata } = paymentData;

    if (!memo || !amount || !metadata?.payment_type) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }

    const newPayment = await createU2APayment(currentUser, paymentData);

    if (!newPayment) {
      return res.status(500).json({ success: false, message: "Failed to initiate payment" });
    }

    res.status(200).json({
      success: true,
      message: "Payment created successfully",
      payment_id: newPayment._id,
    });
  } catch (error: any) {
    logger.error("Payment initiation failed", { error });
    res.status(500).json({ success: false, message: "Failed to initiate payment" });
  }
};

export const onIncompletePaymentFound = async (req: Request, res: Response) => {
  const { payment } = req.body;

  if (!payment || typeof payment !== "object" || !payment.identifier) {
    logger.warn("Invalid or missing payment payload in onIncompletePaymentFound", { payment });
    return res.status(400).json({
      success: false,
      message: "Invalid payment data provided.",
    });
  }

  try {
    const processedPayment = await processIncompletePayment(payment);
    return res.status(200).json(processedPayment);
  } catch (error) {
    logger.error(`Failed to process incomplete payment for paymentID ${payment.identifier}:`, error);
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
    logger.error(`Failed to approve Pi payment for paymentID ${ paymentId }:`, error);
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