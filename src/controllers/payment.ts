

import { Request, Response } from "express";
import axios from "axios";
import { env } from "../utils/env";
import { platformAPIClient } from "../config/platformAPIclient";
import Transaction from "../models/Transaction";
import Order from "../models/Order";


interface Payment {
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
    const payment: Payment = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;

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

    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, {
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

export const onPaymentApproval = async (
  req: Request,
  res: Response
) => {
  const currentUser = req.currentUser;

  try {
    const { paymentId } = req.body;
    const currentPayment = await platformAPIClient.get(
      `/v2/payments/${paymentId}`
    );

    const metadata =  currentPayment.data.metadata;

    // const order = await Order.create({
    //     items: currentPayment.data.metadata.items,
    //     buyer: metadata.buyer,
    //     seller: metadata.seller,
    //     total_amount: currentPayment.data.amount,
    //     fulfillment_method: metadata.fulfillment_method,
    //     seller_filfullment_instruction: metadata.seller_instruction,
    //     buyer_filfullment_details: metadata.buyer_filfullment_details,
    //   })

    //   const newTransaction = await Transaction.create({
    //     order: order,
    //     payment_id: paymentId,
    //     user: currentUser?.pi_uid,
    //     txid: null,
    //     memo: currentPayment.data.memo,
    //     amount: currentPayment.data.amount,
    //     paid: false,
    //     cancelled: false,
    //     created_at: new Date()
    //   });

    const response = await platformAPIClient.post(
      `/v2/payments/${paymentId}/approve`
    );

    // console.log(
    //   "response from Pi server while approving payment: ",
    //   response.data
    // );
    // console.log(
    //   "------------------------------------------------------------------------"
    // );

    return res.status(200).json({
      status: "ok",
      message: `Approved payment with id ${paymentId}`,
    });
  } catch (error: any) {
    console.log("error while approving payment: ", error.message);
    console.log(currentUser);

    return res.status(500).json({
      status: "not ok",
      message: "Internal server error",
      error: error.message,
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

    const currentPayment = await platformAPIClient.get(
      `/v2/payments/${paymentId}`
    );

    //  const transaction = await Transaction.findOneAndUpdate({ payment_id: paymentId }, { $set: { txid: txid, paid: true } }).exec();

    // await Order.findByIdAndUpdate(transaction?.order, 
    //   { $set: {
    //     updated_at: new Date(),
    //     paid: true
    //   }
    // }).exec()
    const response = await platformAPIClient.post(
      `/v2/payments/${paymentId}/complete`,
      { txid }
    );

   

    // console.log(
    //   "response from Pi server while completing payment: ",
    //   response.data
    // );

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
      `/v2/payments/${paymentId}/cancel`
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