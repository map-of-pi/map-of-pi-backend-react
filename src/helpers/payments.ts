import axios from "axios";
import { Router } from "express";
import { platformAPIClient } from "../config/platformAPIclient";
import { verifyToken } from "../middlewares/verifyToken";
// import "../types/session";

export default function mountPaymentsEndpoints(router: Router) {
  // handle the incomplete payment
  router.post('/incomplete', verifyToken, async (req, res) => {
    const payment = req.body.payment;
    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;
    console.log('transacton URL: ', txURL)

    /* 
      implement your logic here
      e.g. verifying the payment, delivering the item to the user, etc...

      below is a naive example
    */

    // find the incomplete order
    const app = req.app;
    const orderCollection = app.locals.orderCollection;
    const order = await orderCollection.findOne({ pi_payment_id: paymentId });

    // order doesn't exist 
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    // check the transaction on the Pi blockchain
    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
    const paymentIdOnBlock = horizonResponse.data.memo;

    // and check other data as well e.g. amount
    if (paymentIdOnBlock !== order.pi_payment_id) {
      return res.status(400).json({ message: "Payment id doesn't match." });
    }

    // mark the order as paid
    await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid, paid: true } });

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

    const app = req.app;

    const paymentId = req.body.paymentId;
    const currentPayment = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    console.log('payment id: ', paymentId)
    console.log('current payment: ', currentPayment.data)
    // const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here 
      e.g. creating an order record, reserve an item if the quantity is limited, etc...
    */

    // await orderCollection.insertOne({
    //   pi_payment_id: paymentId,
    //   product_id: currentPayment.data.metadata.productId,
    //   user: req.currentUser.pi_uid,
    //   txid: null,
    //   paid: false,
    //   cancelled: false,
    //   created_at: new Date()
    // });

    // let Pi Servers know that you're ready
    const TXI = await platformAPIClient.post(`/v2/payments/${paymentId}/approve`);
    console.log('approved and return: ', TXI.data)
    incompletePayment(TXI.data)
    return res.status(200).json({ message: `Approved the payment ${paymentId}` });
  });

  // complete the current payment
  router.post('/complete', verifyToken, async (req, res) => {
    // const app = req.app;

    const paymentId = req.body.paymentId;
    const txid = req.body.txid;
    console.log('transaction id: ', txid)
    // const orderCollection = app.locals.orderCollection;

    /* 
      implement your logic here
      e.g. verify the transaction, deliver the item to the user, etc...
    */

    // await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid: txid, paid: true } });

    // let Pi server know that the payment is completed
    await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
    return res.status(200).json({ message: `Completed the payment ${paymentId}` });
  });

  // handle the cancelled payment
  router.post('/cancelled_payment', verifyToken, async (req, res) => {
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

export const incompletePayment =  async (paymentData: any) => {
  const payment = paymentData;
  const paymentId = payment.identifier;
  const txid = payment.transaction && payment.transaction.txid;
  const txURL = payment.transaction && payment.transaction._link;

  /* 
    implement your logic here
    e.g. verifying the payment, delivering the item to the user, etc...

    below is a naive example
  */

  // find the incomplete order
  // const app = req.app;
  // const orderCollection = app.locals.orderCollection;
  // const order = await orderCollection.findOne({ pi_payment_id: paymentId });

  // order doesn't exist 
  // if (!order) {
  //   return res.status(400).json({ message: "Order not found" });
  // }

  // check the transaction on the Pi blockchain
  const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
  const paymentIdOnBlock = horizonResponse.data.memo;

  // and check other data as well e.g. amount
  // if (paymentIdOnBlock !== order.pi_payment_id) {
  //   return res.status(400).json({ message: "Payment id doesn't match." });
  // }

  // // mark the order as paid
  // await orderCollection.updateOne({ pi_payment_id: paymentId }, { $set: { txid, paid: true } });

  // let Pi Servers know that the payment is completed
  const transaction = await platformAPIClient.post(`/v2/payments/${paymentId}/complete`, { txid });
  console.log('approved xxxxxxxxxxxxx: ', transaction.data)
  // return res.status(200).json({ message: `Handled the incomplete payment ${paymentId}` });
}