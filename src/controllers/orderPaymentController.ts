import { Request, Response } from "express";
import axios from "axios";
import { platformAPIClient } from "../config/platformAPIclient";
import Payment from "../models/Payment";
import Order from "../models/Order";
import Seller from "../models/Seller";
import User from "../models/User";
import { cancelOrder, createOrder, updatePaidOrder } from "../services/order.service";
import { PaymentDataType } from "../types";
import { OrderStatusType } from "../models/enums/orderStatusType";
import logger from "../config/loggingConfig";
import { cancelPayment, completePayment, createA2UPayment, createOrUpdatePaymentCrossReference, createPayment, getPayment } from "../services/payment.service";
import { PaymentType } from "../models/enums/paymentType";
import { U2UPaymentStatus } from "../models/enums/u2uPaymentStatus";
import { FulfillmentType } from "../models/enums/fulfillmentType";

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

    const incompletePayment = await getPayment(paymentId);

    if (!incompletePayment) {
      logger.warn("no incomplete payment")
      return res.status(400).json({ message: "finding incomplement payment failed" });
    }

    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL!);
    const paymentIdOnBlock = horizonResponse.data.memo;
    logger.info("paymentIdOnBlock: ", paymentIdOnBlock);
    if (paymentIdOnBlock !== incompletePayment.pi_payment_id) {
      return res.status(400).json({ error: "Payment not found" });
    }

    const updatedPayment = await completePayment(paymentId, txid as string);
    logger.warn("old payment found and updated");
    const paidOrder = await updatePaidOrder(updatedPayment?._id as string)
    logger.warn("old order found and updated");

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
      .json(
        { success: false, error: error.message || error, message: "error completing pi payment" }
      );
  }
};

export const onPaymentApproval = async (req: Request, res: Response) => {
  const currentUser = req.currentUser;

  try {
    const { paymentId } = req.body;
    const resp = await platformAPIClient.get(`/v2/payments/${paymentId}`);
    // logger.info('PAYMENT ID: ', {paymentId})

    const currentPayment: PaymentDataType = resp.data;

    const oldPayment = await getPayment(paymentId);

    // create new transaction only not exist
    if (!oldPayment) {
      const seller = await Seller.findOne({ seller_id: currentPayment.metadata.seller });
      const buyer = await User.findOne({ pi_uid: currentUser?.pi_uid });

      if (!buyer || !seller) {
        logger.error("Seller or buyer not found");
        return res.status(404).json({ message: "Seller or buyer not found" });
      }

      const paymentData = {
        piPaymentId: paymentId as string,
        userId: buyer?._id as string,
        memo: currentPayment.memo as string,
        amount: currentPayment.amount as string,
        paymentType: PaymentType.BuyerCheckout
      };

      const newPayment = await createPayment(paymentData)

      if (!newPayment) {
        logger.info("Unable to create payment record")
        return res.status(404).json({ message: "Unable to create payment record" });
      }

      // logger.info("new payment successfull: ", newPayment)
      const orderData = {    
        buyerId: buyer?._id as string,
        sellerId: seller?._id as string,        
        paymentId: newPayment._id as string,
        totalAmount: currentPayment.amount as string,
        status: OrderStatusType.Initialized,
        fulfillmentMethod: currentPayment.metadata.fulfillment_method as FulfillmentType,
        sellerFulfillmentDescription: currentPayment.metadata.seller_fulfillment_description as string,
        buyerFulfillmentDescription: currentPayment.metadata.buyer_fulfillment_description as string,
      };

      const orderItemsData = currentPayment.metadata.items;

      // create order and order items
      const newOrder = await createOrder(orderData, orderItemsData);
      logger.info('order created successfully');

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
      message: "Pi payment approval error",
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

    // complete payment status to paid on sucessfull payment
    const completedPayment = await completePayment(paymentId, txid );
    logger.info("payment record completed")

    // update Order status to paid on sucessfull payment
    const order = await updatePaidOrder(completedPayment?._id as string)
    logger.info("order record updated to paid")

    const u2uRefData = {
      u2aPaymentId: completedPayment?._id as string,
      u2uStatus: U2UPaymentStatus.U2ACompleted,
      a2uPaymentId: null,
    }
    const u2uRef = await createOrUpdatePaymentCrossReference(order?._id as string, u2uRefData)
    logger.info("U2U Ref record created/updated", u2uRef)

    if (!order?.total_amount) {
      throw new Error("Order total_amount is undefined");
    }

    const response = await platformAPIClient.post(
      `/v2/payments/${paymentId}/complete`,
      { txid }
    );

    // start A2U payment flow
    const a2uPaymentData = {
      sellerId: order?.seller_id.toString(),
      amount: order?.total_amount.toString(), 
      buyerId: order?.buyer_id.toString(),
      paymentType: PaymentType.BuyerCheckout,
      orderId: order?._id as string
    }

    await createA2UPayment(a2uPaymentData);

    return res
      .status(200)
      .json({ status: "ok", success: true, message: `Completed the payment with id ${paymentId}` });

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

    // update payment cancelled to true on cancel payment
    const cancelledPayment = await cancelPayment(paymentId);

    // update Order status to cancelled on cancel payment
    await cancelOrder(cancelledPayment?._id as string)
    logger.info("order record updated to cancelled")

    await platformAPIClient.post( `/v2/payments/${paymentId}/cancel` );
    logger.info( "response from Pi server on payment cancellation " );

    return res
      .status(200)
      .json({ success: true, message: `Cancelled the payment ${paymentId}` });
      
  } catch (error: any) {
    logger.error("Error while canceling transaction: ", error.message);
    return res.status(400).json({ success: false, message: "Internal Server Error" });
  }
};