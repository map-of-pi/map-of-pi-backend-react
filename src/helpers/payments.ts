
import axios from "axios";
import { Router } from "express";
import { platformAPIClient } from "../config/platformAPIclient";
import { verifyToken } from "../middlewares/verifyToken";
import Order from "../models/Order";
import Transaction from "../models/Transaction";
import User from "../models/User";

interface Payment {
  identifier: string;
  transaction?: {
    txid: string;
    _link: string;
  };
}

export default function mountPaymentsEndpoints(router: Router) {
  // handle the incomplete payment
  router.post('/incomplete', async (req, res) => {
    const payment: Payment = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;
    const currentPayment = await platformAPIClient.get(
      `/v2/payments/${paymentId}`
    );

    /* 
      implement your logic here
      e.g. verifying the payment, delivering the item to the user, etc...

      below is a naive example
    */

    // find the incomplete order
    const transaction = await Transaction.findOne({ payment_id: paymentId });

    // order doesn't exist 
    if (!transaction) {
      return res.status(400).json({ message: "transaction not found" });
    }

    // check the transaction on the Pi blockchain
    //@ts-ignore
    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
    const paymentIdOnBlock = horizonResponse.data.memo;

    console.log("payment id on BLOCK",  horizonResponse.data)

    // and check other data as well e.g. amount
    if (paymentIdOnBlock !== transaction.payment_id) {
      return res.status(400).json({ message: "Payment id doesn't match." });
    }

    // mark the order as paid
    await Transaction.findOneAndUpdate({ pi_payment_id: paymentId }, { $set: { txid, paid: true } }, {new: true}).exec();
    await Order.findByIdAndUpdate(transaction?.order, 
      { $set: {
        updated_at: new Date(),
        paid: true
      }
    }).exec()

    // let Pi Servers know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    return res.status(200).json({ message: `Handled the incomplete payment ${paymentId}` });
  });

  // approve the current payment
  router.post('/approve', verifyToken, async (req, res) => {
    const userId = req.currentUser?.pi_uid
    console.log('current user Id: ', userId)
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: "User needs to sign in first" });
    }

    const paymentId = req.body.paymentId;
    const currentPayment = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    console.log('payment id: ', paymentId)
    console.log('current payment: ', currentPayment.data)
    // const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here 
      e.g. creating an order record, reserve an item if the quantity is limited, etc...
    */

      const user = await User.findOne({pi_uid: userId}).exec()
      const metadata =  currentPayment.data.metadata;

    const order = await Order.create({
      items: currentPayment.data.metadata.items,
      buyer: metadata.buyer,
      seller: metadata.seller,
      total_amount: currentPayment.data.amount,
      fulfillment_method: metadata.fulfillment_method,
      seller_filfullment_instruction: metadata.seller_instruction,
      buyer_filfullment_details: metadata.buyer_filfullment_details,
    })

    console.log("created new order: ", order)

    const newTransaction = await Transaction.create({
      order: order,
      payment_id: paymentId,
      user: user,
      txid: null,
      memo: currentPayment.data.memo,
      amount: currentPayment.data.amount,
      paid: false,
      cancelled: false,
      created_at: new Date()
    });

    console.log("created new transaction: ", newTransaction)

    // let Pi Servers know that you're ready
    const TXI = await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);
    console.log('approved and return: ', TXI.data)
    return res.status(200).json({ message: `Approved the payment ${paymentId}` });
  });

  // complete the current payment
  router.post('/complete', async (req, res) => {
    // const app = req.app;

    const paymentId = req.body.paymentId;
    const txid = req.body.txid;
    console.log('transaction id: ', txid)
    // const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here
      e.g. verify the transaction, deliver the item to the user, etc...
    */

    const transaction = await Transaction.findOneAndUpdate({ payment_id: paymentId }, { $set: { txid: txid, paid: true } }).exec();

    await Order.findByIdAndUpdate(transaction?.order, 
      { $set: {
        updated_at: new Date(),
        paid: true
      }
    }).exec()

    // let Pi server know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    return res.status(200).json({ message: `Completed the payment ${paymentId}` });
  });

  // handle the cancelled payment
  router.post('/cancelled_payment', async (req, res) => {
    // const app = req.app;

    const paymentId = req.body.paymentId;
    console.log('payment id: ', paymentId)
    // const orderCollection = app.locals.orderCollection;

    /*
      implement your logic here
      e.g. mark the order record to cancelled, etc...
    */

    // await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { cancelled: true } });
    return res.status(200).json({ message: `Cancelled the payment ${paymentId}` });
  })
}


