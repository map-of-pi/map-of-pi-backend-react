import { Request, Response } from "express";
import { Types } from "mongoose";
import { platformAPIClient } from "../config/platformAPIclient";
import User from "../models/User";
import Seller from "../models/Seller";
import Order from "../models/Order";
import Payment from "../models/Payment";
import { OrderStatusType } from "../models/enums/orderStatusType";
import { IOrder } from "../types";
import logger from "../config/loggingConfig";
import { PaymentType } from "../models/enums/paymentType";

interface Payment {
  identifier: string;
  transaction?: {
    txid: string;
    _link: string;
  };
}

export const onIncompletePaymentFound = async (req: Request, res: Response) => {
  try {
    const payment: Payment = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;

    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
      txid,
    });

    return res.status(200).json({
      message: `Completed payment from incomplete payment with id: ${paymentId}`,
    });
  } catch (error) {
    logger.error('Failed while processing incomplete payment:', error);

    return res.status(500).json({ 
      message: 'An error occurred while processing incomplete payment; please try again later' 
    });
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  try {
    const { paymentId } = req.body;
    const currentPayment = await platformAPIClient.get(`/v2/payments/${paymentId}`);

    let metadata = currentPayment.data.metadata;
    const oldTransaction = await Payment.findOne({payment_id: paymentId})

    // create new transaction if previous transaction doesn't exist
    if (!oldTransaction) {
      const seller = await Seller.findOne({ seller_id: metadata.seller });
      const buyer = await User.findOne({ pi_uid: currentUser?.pi_uid });

      if (!buyer || !seller) {
        return res.status(404).json({ message: "Buyer or seller is not found" });
      }

      const newTransaction = await Payment.create({
        user_id: buyer._id,  // Ensure this is an ObjectId
        payment_id: paymentId,
        txid: null,
        amount: currentPayment.data.amount,
        paid: false,
        cancelled: false,
        memo: currentPayment.data.memo,
        payment_type: PaymentType.BuyerCheckout
      });

      if (!newTransaction) {
        return res.status(404).json({ message: "Transaction cannot be created" });
      }

      const orderData: Partial<IOrder> = {    
        payment_id: newTransaction._id as unknown as Types.ObjectId,
        buyer_id: metadata.buyer,
        seller_id: metadata.seller,        
        total_amount: currentPayment.data.amount,
        is_paid: false,
        is_fulfilled: false,
        status: OrderStatusType.Initialized,
        fulfillment_method: metadata.fulfillment_method,
        buyer_fulfillment_description: metadata.buyer_fulfillment_description,
        seller_fulfillment_description: metadata.seller_instruction,
      };
    }
    
    return res.status(200).json({
      message: `Approved payment with id ${paymentId}`,
      // order: newOrder, // Optional: Return the created/updated order
    });
  } catch (error) {
    logger.error('Failed while processing payment approval:', error);

    return res.status(500).json({ 
      message: 'An error occurred while processing approval of payment; please try again later' 
    });
  }
};

export const onPaymentCompletion = async (req: Request, res: Response) => {
  try {
    const paymentId: string = req.body.paymentId;
    const txid: string = req.body.txid;

    await platformAPIClient.get(
      `/v2/payments/${paymentId}`
    );

    // update transaction status to 'paid' on successful payment
    const transaction = await Payment.findOneAndUpdate({ payment_id: paymentId }, { $set: { txid: txid, paid: true } }).exec();

    // update order status to 'paid' on successful payment
    await Order.findOneAndUpdate({payment_id: transaction?._id}, 
      { $set: {
        is_paid: true,
        status: OrderStatusType.Pending
      }
    }).exec()

    const response = await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    
    logger.debug("response from Pi server while completing payment: ", response);

    return res.status(200).json({ message: `Completed the payment for id: ${paymentId}` });
  } catch (error) {
    logger.error('Failed while processing payment completion:', error);

    return res.status(500).json({ 
      message: 'An error occurred while processing completion of payment; please try again later' 
    });
  }
};

export const onPaymentCancellation = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    return res.status(200).json({ message: `Cancelled the payment for id: ${paymentId}` });
  } catch (error) {
    logger.error('Failed while processing payment cancellation:', error);

    return res.status(500).json({ 
      message: 'An error occurred while processing cancellation of payment; please try again later' 
    });
  }
};
