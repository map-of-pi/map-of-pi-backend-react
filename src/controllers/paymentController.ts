import { Request, Response } from "express";
import axios from "axios";
import { platformAPIClient } from "../config/platformAPIclient";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Seller from "../models/Seller";
import User from "../models/User";
import { createOrder } from "../services/order.service";
import { IOrder } from "../types";
import { OrderStatusType } from "../models/enums/orderStatusType";
import { Types } from "mongoose";
import logger from "../config/loggingConfig";

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

    // const transaction = await Transaction.findOne({ payment_id: paymentId });

    // if (!transaction) {
    //   return res.status(400).json({ message: "transaction not found" });
    // }

    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL!);
    const paymentIdOnBlock = horizonResponse.data.memo;

    // if (paymentIdOnBlock !== transaction.payment_id) {
    //   return res.status(400).json({ error: "Transaction not found" });
    // }

    // await Transaction.findOneAndUpdate({ pi_payment_id: paymentId }, { $set: { txid, paid: true } }, {new: true}).exec();
    // await Order.findByIdAndUpdate(transaction?.order, 
    //   { $set: {
    //     updated_at: new Date(),
    //     paid: true
    //   }
    // }).exec()

    // console.log("current payment : ", currentDeposit);

    await platformAPIClient.post(`/payments/${paymentId}/complete`, {
      txid,
    });

    return res.status(200).json({
      message: `Completed payment from incomplete payment with id ${paymentId}`,
    });
  } catch (error: any) {
    console.log("error while finding incomplete payment: ", error.message);

    return res
      .status(500)
      .json({ error: "Internal server error", ref: error.message });
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  try {
    const { paymentId } = req.body;
    const currentPayment = await platformAPIClient.get(`/payments/${paymentId}`);

    // let metadata = currentPayment.data.metadata;
    // const oldTransaction = await Transaction.findOne({payment_id: paymentId})

    // create new transaction only not exist
    // if (!oldTransaction) {
    //   const seller = await Seller.findOne({ seller_id: metadata.seller });
    //   const buyer = await User.findOne({ pi_uid: currentUser?.pi_uid });

    //   if (!buyer || !seller) {
    //     return res.status(404).json({ message: "Seller or buyer not found" });
    //   }

    //   const newTransaction = await Transaction.create({
    //     payment_id: paymentId,
    //     user: buyer._id,  // Ensure this is an ObjectId
    //     txid: null,
    //     memo: currentPayment.data.memo,
    //     amount: currentPayment.data.amount,
    //     paid: false,
    //     cancelled: false,
    //     created_at: new Date(),
    //   });

      // if (!newTransaction) {
      //   return res.status(404).json({ message: "Transaction cannot be created" });
      // }

      // console.log("new Transaction: ", newTransaction)

      // const orderData: Partial<IOrder> = {    
      //   buyer_id: metadata.buyer,
      //   seller_id: metadata.seller,        
      //   transaction: newTransaction._id as Types.ObjectId,
      //   total_amount: currentPayment.data.amount,
      //   status: OrderStatusType.New,
      //   paid: false,
      //   filled: false,
      //   createdAt: new Date(),
      //   updatedAt: new Date(),
      //   fulfillment_method: metadata.fulfillment_method,
      //   seller_fulfillment_description: metadata.seller_instruction,
      //   buyer_fulfillment_description: metadata.buyer_fulfillment_description,
      // };

      // console.log('ITEMS DATA: ', metadata.items)

      // const orderItemsData = metadata.items;

      // create order and order items
      // const newOrder = await addOrUpdateOrder(null, orderData as IOrder, orderItemsData);

    // }
    
    // Approve payment request
    const response = await platformAPIClient.post(`/payments/${paymentId}/approve`);

    // console.log("Response from Pi server while approving payment: ", response.data);

    return res.status(200).json({
      status: "ok",
      message: `Approved payment with id ${paymentId}`,
      // order: newOrder, // Optional: Return the created/updated order
    });

  } catch (error: any) {
    return res.status(500).json({
      status: "not ok",
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
    const currentUser = req.currentUser;
    const paymentId: string = req.body.paymentId;
    const txid: string = req.body.txid;

    await platformAPIClient.get(
      `/payments/${paymentId}`
    );

    // update transaction status to paid on sucessfull payment
    const payment = await Payment.findOneAndUpdate({ payment_id: paymentId }, { $set: { txid: txid, paid: true } }).exec();

    // update Order status to paid on sucessfull payment
    await Order.findOneAndUpdate({payment_id: payment?._id}, 
      { $set: {
        updated_at: new Date(),
        paid: true,
        status: OrderStatusType.Pending
      }
    }).exec()
    const response = await platformAPIClient.post(
      `/payments/${paymentId}/complete`,
      { txid }
    );
    
    console.log(
      "response from Pi server while completing payment: ",
      response
    );

    return res
      .status(200)
      .json({ message: `Completed the payment with id ${paymentId}` });
  } catch (error: any) {
    console.error("Error while completing payment: ", error.message);

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
      `/payments/${paymentId}/cancel`
    );

    // console.log(
    //   "response from Pi server on payment cancellation: ",
    //   response.data
    // );

    return res
      .status(200)
      .json({ message: `Cancelled the payment ${paymentId}` });
  } catch (error: any) {
    console.error("Error while canceling transaction: ", error.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};