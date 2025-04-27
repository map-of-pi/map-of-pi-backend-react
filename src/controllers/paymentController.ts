import { Request, Response } from "express";
import logger from "../config/loggingConfig";
import { platformAPIClient } from "../config/platformAPIclient";

import Payment from "../models/Payment";
import { MembershipClassType } from "../models/enums/membershipClassType";

import * as membershipService from "../services/membership.service";
import { paymentType } from "../models/enums/paymentType";

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    const { amount, metadata, paymentId } = req.body;

    if (!authUser) {
      logger.warn("User not authenticated at initiatePayment");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!amount || !paymentId) {
      return res.status(400).json({ error: "Missing required fields: amount or paymentId" });
    }


    const payment = await Payment.create({
      user: authUser._id,
      pi_payment_id: paymentId,
      amount,
      memo: metadata?.membership_class
        ? `Membership purchase for ${metadata.membership_class}`
        : "",
      paid: false,
      cancelled: false,
      payment_type: paymentType.MEMBERSHIP_UPGRADE,
      metadata,
    });

    return res.status(200).json({
      message: "Payment initiated",
      paymentId: payment.pi_payment_id,
      paymentDbId: payment._id,
    });
  } catch (error) {
    logger.error("Error initiating payment:", error);
    return res
      .status(500)
      .json({ error: "Server error while initiating payment" });
  }
};

export const approvePayment = async (req: Request, res: Response) => {
  console.log("🔥 approvePayment controller hit");
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    // Call Pi Server to approve
    await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);

    // Attempt to find and update the local payment
    const payment = await Payment.findOneAndUpdate(
      { pi_payment_id: paymentId, status: "pending" },
      { status: "approved" },
      { new: true }
    );

    // If not found or not in expected state, log and return with detail
    if (!payment) {
      logger.warn(`No payment found or already processed. paymentId=${paymentId}`);
      return res.status(404).json({
        error: "Payment not found or not in pending status",
        code: "NOT_FOUND_MAYBE_UNSIGNED"
      });
    }

    return res.status(200).json({ message: "Payment approved", payment });
  } catch (error) {
    logger.error("Error approving payment:", error);
    return res.status(500).json({ error: "Approval failed" });
  }
};

export const completePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid) {
      return res.status(400).json({
        error: "paymentId and txid are required to complete payment",
      });
    }

    const payment = await Payment.findOne({ pi_payment_id: paymentId });

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
      });
    }
    
    if (payment.status === "completed") {
      return res.status(200).json({
        message: "Payment already completed",
        payment,
      });
    }
    
    if (payment.status !== "approved") {
      return res.status(400).json({
        error: "Payment not in approved status",
      });
    }

    // Finalize on Pi Server
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });

    // Update local payment
    payment.status = "completed";
    payment.txid = txid;
    payment.paid = true;
    await payment.save();

    // Finalize membership if needed
    if (payment.metadata?.membership_class) {
      try {
        await membershipService.updateMembershipAfterPayment(
          { _id: payment.user } as any,
          payment.metadata
        );
      } catch (err) {
        logger.error(
          `Error updating membership after paymentId=${paymentId}:`,
          err
        );
        return res.status(500).json({
          error: "Payment completed but membership update failed",
        });
      }
    }

    return res.status(200).json({
      message: "Payment completed",
      payment,
    });
  } catch (error) {
    logger.error("Error completing payment:", error);
    return res.status(500).json({ error: "Failed to complete payment" });
  }
};

export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    const payment = await Payment.findOneAndUpdate(
      { pi_payment_id: paymentId },
      { status: "failed", cancelled: true },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.status(200).json({ message: "Payment cancelled", payment });
  } catch (error) {
    logger.error("Error cancelling payment:", error);
    return res.status(500).json({ error: "Failed to cancel payment" });
  }
};
