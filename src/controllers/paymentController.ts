import { Request, Response } from "express";
import axios from "axios";
import { platformAPIClient } from "../config/platformAPIclient";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Seller from "../models/Seller";
import User from "../models/User";
import { createOrder } from "../services/order.service";
import { IOrder, IPayment, PaymentDataType, PaymentMetadataType } from "../types";
import { OrderStatusType } from "../models/enums/orderStatusType";
import { Types } from "mongoose";
import logger from "../config/loggingConfig";
import { createPayment } from "../services/payment.service";

interface PaymentInfo {
  identifier: string;
  transaction?: {
    txid: string;
    _link: string;
  };
}

export const onIncompletePaymentFound = async (
  req: Request,
  res: Response
) => {
  const currentUser = req.currentUser;

  try {
    const payment: PaymentInfo = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;
    logger.info("incomplete payment data: ", payment);

    const incompletePayment = await Payment.findOne({ pi_payment_id: paymentId });

    if (!incompletePayment) {
      logger.warn("no incomplete payment")
      return res.status(400).json({ message: "finding incomplement payment failed" });
    }

    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL!);
    const paymentIdOnBlock = horizonResponse.data.memo;
    console.info("paymentIdOnBlock: ", paymentIdOnBlock);
    if (paymentIdOnBlock !== incompletePayment.pi_payment_id) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const updatedPayment = await Payment.findOneAndUpdate({ pi_payment_id: paymentId }, { $set: { txid, paid: true } }, {new: true}).exec();
    logger.warn("old payment found");
    await Order.findOneAndUpdate({payment_id: updatedPayment?._id}, 
      { $set: {
        updatedAt: new Date(),
        paid: true,
        status: OrderStatusType.Pending
      }
    }).exec()
    // return res.status(400).json({ message: "finding old payment failed" });

    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
      txid,
    });

    return res.status(200).json({
      message: `Completed payment from incomplete payment with id ${paymentId}`,
    });
  } catch (error: any) {
    logger.info("error while finding incomplete payment: ", error.message);

    return res
      .status(500)
      .json({ error: "Internal server error", ref: error.message });
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  try {
    const { paymentId } = req.body;
    const resp = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    // logger.info('PAYMENT ID: ', {paymentId})

    const currentPayment: PaymentDataType = resp.data;

    const oldPayment = await Payment.findOne({pi_payment_id: paymentId})

    // create new transaction only not exist
    if (!oldPayment) {
      const seller = await Seller.findOne({ seller_id: currentPayment.metadata.seller });
      const buyer = await User.findOne({ pi_uid: currentUser?.pi_uid });

      if (!buyer || !seller) {
        logger.error("Seller or buyer not found");
        return res.status(404).json({ message: "Seller or buyer not found" });
      }

      const paymentData: Partial<IPayment> = {
        pi_payment_id: paymentId,
        user_id: buyer?._id as Types.ObjectId,
        txid: null,
        memo: currentPayment.memo,
        amount: currentPayment.amount,
        paid: false,
        cancelled: false,
      };

      const newPayment = await createPayment(paymentData)

      if (!newPayment) {
        logger.info("Unable to create payment record")
        return res.status(404).json({ message: "Unable to create payment record" });
      }

      // logger.info("new payment successfull: ", newPayment)
      const orderData: Partial<IOrder> = {    
        buyer_id: buyer?._id as Types.ObjectId,
        seller_id: seller?._id as Types.ObjectId,        
        payment_id: newPayment._id as Types.ObjectId,
        total_amount: currentPayment.amount,
        status: OrderStatusType.Initialized,
        fulfillment_method: currentPayment.metadata.fulfillment_method,
        seller_fulfillment_description: currentPayment.metadata.seller_fulfillment_description,
        buyer_fulfillment_description: currentPayment.metadata.buyer_fulfillment_description,
      };

      const orderItemsData = currentPayment.metadata.items;

      // create order and order items
      const newOrder = await createOrder(orderData, orderItemsData);
      logger.info('order created successfully', newOrder);

    }
    
    // Approve payment request
    const response = await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);

    // logger.info("Response from Pi server while approving payment: ", response.data);
    return res.status(200).json({
      status: "ok",
      success: true,
      message: `Approved payment with id ${paymentId}`,
      // order: newOrder, // Optional: Return the created/updated order
    });

  } catch (error: any) {
    return res.status(500).json({
      status: "not ok",
      success: false,
      message: "Internal server error",
      error: error.message || error,
    });
  }
};

export const onPaymentCompletion = async (
  req: Request,
  res: Response
) => {
  try {
    // const currentUser = req.currentUser;
    const paymentId: string = req.body.paymentId;
    const txid: string = req.body.txid;

    await platformAPIClient.get(
      `/v2/payments/${paymentId}`
    );

    const response = await platformAPIClient.post(
      `/v2/payments/${paymentId}/complete`,
      { txid }
    );

    // update transaction status to paid on sucessfull payment
    const payment = await Payment.findOneAndUpdate({ pi_payment_id: paymentId }, { $set: { txid: txid, paid: true } }).exec();

    // logger.info("payment record updated")

    // update Order status to paid on sucessfull payment
    await Order.findOneAndUpdate({payment_id: payment?._id}, 
      { $set: {
        updatedAt: new Date(),
        is_paid: true,
        status: OrderStatusType.Pending
      }
    }).exec()
    logger.info("order record updated")
    
    // logger.info(
    //   "response from Pi server while completing payment: ",
    //   response.data
    // );

    return res
      .status(200)
      .json({ success: true, message: `Completed the payment with id ${paymentId}` });

  } catch (error: any) {
    logger.error("Error while completing payment: ", error.message);
    return res.status(500).json({
      status: "not ok",
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const onPaymentCancellation = async (
  req: Request,
  res: Response
) => {
  try {
    const { paymentId } = req.body;
    const response = await platformAPIClient.post(
      `/v2/payments/${paymentId}/cancel`
    );

    logger.info(
      "response from Pi server on payment cancellation: ",
      response.data.message
    );

    // update transaction status to paid on sucessfull payment
    const payment = await Payment.findOneAndUpdate({ pi_payment_id: paymentId }, { $set: { cancelled: true, paid: false } }).exec();

    // update Order status to paid on sucessfull payment
    await Order.findOneAndUpdate({payment_id: payment?._id}, 
      { $set: {
        updatedAt: new Date(),
        is_paid: false,
        status: OrderStatusType.Cancelled
      }
    }).exec()

    return res
      .status(200)
      .json({ success: true, message: `Cancelled the payment ${paymentId}` });
  } catch (error: any) {
    logger.error("Error while canceling transaction: ", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};