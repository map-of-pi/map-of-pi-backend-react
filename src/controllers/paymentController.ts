import axios from "axios";
import { Request, Response } from "express";
import logger from "../config/loggingConfig";
import { platformAPIClient } from "../config/platformAPIclient";
import OrderCheckout from "../helpers/orderCheckout";
import { PaymentType } from "../models/enums/paymentType";
import { U2UPaymentStatus } from "../models/enums/u2uPaymentStatus";
import { cancelOrder, updatePaidOrder } from "../services/order.service";
import { 
  cancelPayment, 
  completePayment, 
  createA2UPayment, 
  createOrUpdatePaymentCrossReference, 
  getPayment 
} from "../services/payment.service";
import { IUser, PaymentDataType, PaymentInfo } from "../types";

export const onIncompletePaymentFound = async (req: Request, res: Response) => {
  try {
    const payment: PaymentInfo = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;
    logger.info("Incomplete payment data: ", payment);

    // Retrieve the original (incomplete) payment record by its identifier
    const incompletePayment = await getPayment(paymentId);
    if (!incompletePayment) {
      logger.warn("No incomplete payment record found");
      return res.status(400).json({ message: "Finding incomplement payment failed" });
    }

    // Fetch the payment memo from the Pi Blockchain via Horizon API
    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL!);
    const blockchainMemo = horizonResponse.data.memo;
    logger.info("paymentIdOnBlock: ", blockchainMemo);
    // Validate that the memo from the blockchain matches the expected payment ID
    if (blockchainMemo !== incompletePayment.pi_payment_id) {
      return res.status(400).json({ error: "Unable to find payment on the Pi Blockchain" });
    }

    // Mark the payment as completed
    const updatedPayment = await completePayment(paymentId, txid as string);
    logger.warn("Old payment found and updated");
    // If the completed payment was for a buyer checkout, update the associated order
    if (updatedPayment?.payment_type === PaymentType.BuyerCheckout) {
     await updatePaidOrder(updatedPayment?._id as string)
      logger.warn("Old order found and updated");
    }

    // Notify the Pi Platform that the payment is complete
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });

    return res.status(200).json({
      success: true,
      message: `Payment completed from incomplete payment with id ${paymentId}`,
    });
  } catch (error) {
    logger.error('Failed to find/ process incomplete payment:', error);

    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while finding and processing incomplete payment; please try again later'
    });
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser as IUser;

  try {
    const { paymentId } = req.body;
    // Fetch payment details from the Pi platform using the payment ID
    const resp = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    const currentPayment: PaymentDataType = resp.data;

    // Check if a payment record with this ID already exists in the database
    const oldPayment = await getPayment(paymentId);
    if (oldPayment) {
      logger.info("Payment record already exists: ", oldPayment._id);
      return res.status(200).json({
        success: false,
        message: `Payment with id ${paymentId} already exists`,
      }); 
    }

    // Handle logic based on the BuyerCheckout payment type and create a new order
    if (currentPayment?.metadata.payment_type === PaymentType.BuyerCheckout) {
      const newOrder = await OrderCheckout(paymentId, currentUser, currentPayment);
      logger.info("Order created successfully: ", newOrder._id);
    } else if (currentPayment?.metadata.payment_type === PaymentType.Membership) {
      logger.info("Membership subscription processed successfully");
    }
    
    // Approve the payment on the Pi platform
    await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);

    return res.status(200).json({
      success: true,
      message: `Approved payment with id ${paymentId}`,
    });
  } catch (error) {
    logger.error('Failed to approve Pi payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while approving Pi payment; please try again later'
    });
  }
};

export const onPaymentCompletion = async (req: Request, res: Response) => {
  try {
    const paymentId: string = req.body.paymentId;
    const txid: string = req.body.txid;

    // Confirm the payment exists via Pi platform API
    await platformAPIClient.get(`/v2/payments/${paymentId}`);

    // Mark the payment as completed
    const completedPayment = await completePayment(paymentId, txid);
    logger.info("Payment record marked as completed");

    if (completedPayment?.payment_type === PaymentType.BuyerCheckout) {
      // Update the associated order's status to paid
      const order = await updatePaidOrder(completedPayment?._id as string)
      logger.info("Order record updated to paid");

      // Save cross-reference for U2U payment tracking
      const u2uRefData = {
        u2aPaymentId: completedPayment?._id as string,
        u2uStatus: U2UPaymentStatus.U2ACompleted,
        a2uPaymentId: null,
      }
      const u2uRef = await createOrUpdatePaymentCrossReference(order?._id as string, u2uRefData);
      logger.info("U2U cross-reference saved", u2uRef);

      // Notify Pi Platform of successful completion
      await platformAPIClient.post( `/v2/payments/${paymentId}/complete`, { txid } );

      // Ensure order amount is available before creating seller payout
      if (!order?.total_amount) {
        throw new Error("Order total_amount is undefined");
      }

      // Start A2U (App-to-User) payment to the seller
      const a2uPaymentData = {
        sellerId: order?.seller_id.toString(),
        amount: order?.total_amount.toString(), 
        buyerId: order?.buyer_id.toString(),
        paymentType: PaymentType.BuyerCheckout,
        orderId: order?._id as string
      }
      await createA2UPayment(a2uPaymentData);

    } else if (completedPayment?.payment_type === PaymentType.Membership) {
      // Notify Pi platform for membership payment completion
      await platformAPIClient.post( `/v2/payments/${paymentId}/complete`, { txid } );
      logger.info("Membership subscription completed");
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Completed the payment with id ${paymentId}` 
    });
  } catch (error) {
    logger.error('Failed to complete Pi payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while completing Pi payment; please try again later',
    });
  }
};

export const onPaymentCancellation = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    // Mark the payment as cancelled
    const cancelledPayment = await cancelPayment(paymentId);

    // Perform cancellation logic based on the type of payment
    if (cancelledPayment?.payment_type === PaymentType.BuyerCheckout) {
      // Cancel the related order
      await cancelOrder(cancelledPayment?._id as string);
      logger.info("Order record updated to cancelled");
    } else if (cancelledPayment?.payment_type === PaymentType.Membership) {
      logger.info("Membership subscription cancelled");
    }

    // Notify the Pi platform that the payment has been cancelled
    await platformAPIClient.post( `/v2/payments/${paymentId}/cancel` );
    logger.info("Successfully posted cancellation to Pi platform");

    return res.status(200).json({ 
      success: true, 
      message: `Cancelled the payment ${paymentId}` });
  } catch (error) {
    logger.error('Failed to cancel Pi payment:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while cancelling Pi payment; please try again later', 
    });
  }
};