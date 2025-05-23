import axios from 'axios';
import { platformAPIClient } from '../config/platformAPIclient';
import Seller from '../models/Seller';
import User from '../models/User';
import { FulfillmentType } from '../models/enums/fulfillmentType';
import { OrderStatusType } from '../models/enums/orderStatusType';
import { PaymentType } from "../models/enums/paymentType";
import { U2UPaymentStatus } from '../models/enums/u2uPaymentStatus';
import { 
  getPayment, 
  createPayment, 
  completePayment, 
  createOrUpdatePaymentCrossReference,
  createA2UPayment,
  cancelPayment
} from '../services/payment.service';
import { 
  cancelOrder, 
  createOrder, 
  updatePaidOrder 
} from '../services/order.service';
import { IUser, PaymentDataType, PaymentInfo } from '../types';
import logger from '../config/loggingConfig';

export const checkoutProcess = async (
  piPaymentId: string, 
  authUser: IUser, 
  currentPayment:PaymentDataType
) => {
  const seller = await Seller.findOne({ seller_id: currentPayment.metadata.OrderPayment?.seller });
  const buyer = await User.findOne({ pi_uid: authUser?.pi_uid });

  if (!buyer || !seller) {
    logger.error("Seller or buyer not found");
    throw new Error( "Seller or buyer not found" );
  }

  const paymentData = {
    piPaymentId: piPaymentId as string,
    userId: buyer?._id as string,
    memo: currentPayment.memo as string,
    amount: currentPayment.amount as string,
    paymentType: PaymentType.BuyerCheckout
  };

  const newPayment = await createPayment(paymentData)

  if (!newPayment) {
    logger.info("Unable to create payment record")
    throw new Error( "Unable to create payment record" );
  }

  // logger.info("new payment successfull: ", newPayment)
  const orderData = {    
    buyerId: buyer?._id as string,
    sellerId: seller?._id as string,        
    paymentId: newPayment._id as string,
    totalAmount: currentPayment.amount as string,
    status: OrderStatusType.Initialized,
    fulfillmentMethod: currentPayment.metadata.OrderPayment?.fulfillment_method as FulfillmentType,
    sellerFulfillmentDescription: currentPayment.metadata.OrderPayment?.seller_fulfillment_description as string,
    buyerFulfillmentDescription: currentPayment.metadata.OrderPayment?.buyer_fulfillment_description as string,
  };

  const orderItemsData = currentPayment.metadata.OrderPayment?.items;

  if (!orderItemsData) {
    logger.error("Order items not found in payment metadata");
    throw new Error( "Order items not found in payment metadata" );
  }
  // create order and order items
  const newOrder = await createOrder(orderData, orderItemsData);
  logger.info('order created successfully');

  return newOrder;
}

export const processIncompletePayment = async (payment: PaymentInfo) => {
  const paymentId = payment.identifier;
  const txid = payment.transaction?.txid;
  const txURL = payment.transaction?._link;
  logger.info("Incomplete payment data: ", payment);

  // Retrieve the original (incomplete) payment record by its identifier
  const incompletePayment = await getPayment(paymentId);
  if (!incompletePayment) {
    logger.warn("No incomplete payment record found");
    throw new Error("Finding incomplete payment failed");
  }

  // Fetch the payment memo from the Pi Blockchain via Horizon API
  const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL!);
  const blockchainMemo = horizonResponse.data.memo;
  logger.info("paymentIdOnBlock: ", blockchainMemo);

  // Validate that the memo from the blockchain matches the expected payment ID
  if (blockchainMemo !== incompletePayment.pi_payment_id) {
    throw new Error("Unable to find payment on the Pi Blockchain");
  }

  // Mark the payment as completed
  const updatedPayment = await completePayment(paymentId, txid as string);
  logger.warn("Old payment found and updated");

  // If the completed payment was for a buyer checkout, update the associated order
  if (updatedPayment?.payment_type === PaymentType.BuyerCheckout) {
    await updatePaidOrder(updatedPayment._id as string);
    logger.warn("Old order found and updated");
  }

  // Notify the Pi Platform that the payment is complete
  await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });

  return {
    success: true,
    message: `Payment completed from incomplete payment with id ${ paymentId }`,
  };
};

export const processPaymentApproval = async (
  paymentId: string,
  currentUser: IUser
): Promise<{ success: boolean; message: string }> => {
  // Fetch payment details from the Pi platform using the payment ID
  const resp = await platformAPIClient.get(`/v2/payments/${ paymentId }`);
  const currentPayment: PaymentDataType = resp.data;

  // Check if a payment record with this ID already exists in the database
  const oldPayment = await getPayment(paymentId);
  if (oldPayment) {
    logger.info("Payment record already exists: ", oldPayment._id);
    return {
      success: false,
      message: `Payment with ID ${paymentId} already exists`,
    };
  }

  // Handle logic based on the BuyerCheckout payment type and create a new order
  if (currentPayment?.metadata.payment_type === PaymentType.BuyerCheckout) {
    const newOrder = await checkoutProcess(paymentId, currentUser, currentPayment);
    logger.info("Order created successfully: ", newOrder._id);
  } else if (currentPayment?.metadata.payment_type === PaymentType.Membership) {
    logger.info("Membership subscription processed successfully");
  }

  // Approve the payment on the Pi platform
  await platformAPIClient.post(`/v2/payments/${ paymentId }/approve`);

  return {
    success: true,
    message: `Payment approved with id ${ paymentId }`,
  };
};

export const processPaymentCompletion = async (paymentId: string, txid: string) => {
  // Confirm the payment exists via Pi platform API
  await platformAPIClient.get(`/v2/payments/${ paymentId }`);

  // Mark the payment as completed
  const completedPayment = await completePayment(paymentId, txid);
  logger.info("Payment record marked as completed");

  if (completedPayment?.payment_type === PaymentType.BuyerCheckout) {
    // Update the associated order's status to paid
    const order = await updatePaidOrder(completedPayment._id as string);
    logger.info("Order record updated to paid");

    // Save cross-reference for U2U payment tracking
    const u2uRefData = {
      u2aPaymentId: completedPayment._id as string,
      u2uStatus: U2UPaymentStatus.U2ACompleted,
      a2uPaymentId: null,
    };
    await createOrUpdatePaymentCrossReference(order._id as string, u2uRefData);
    logger.info("U2U cross-reference saved", u2uRefData);

    // Notify Pi Platform of successful completion
    await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });

    // Ensure order amount is available before creating seller payout
    if (!order.total_amount) {
      throw new Error("Order total_amount is undefined");
    }

     // Start A2U (App-to-User) payment to the seller
    await createA2UPayment({
      sellerId: order.seller_id.toString(),
      amount: order.total_amount.toString(),
      buyerId: order.buyer_id.toString(),
      paymentType: PaymentType.BuyerCheckout,
      orderId: order._id as string
    });

  } else if (completedPayment?.payment_type === PaymentType.Membership) {
    // Notify Pi platform for membership payment completion
    await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });
    logger.info("Membership subscription completed");
  }

  return {
    success: true,
    message: `Payment completed with id ${ paymentId }`,
  };
};

export const processPaymentCancellation = async (paymentId: string) => {
  // Mark the payment as cancelled
  const cancelledPayment = await cancelPayment(paymentId);

  if (!cancelledPayment) {
    throw new Error(`No payment found with id ${ paymentId }`);
  }

  // Perform cancellation logic based on the type of payment
  if (cancelledPayment.payment_type === PaymentType.BuyerCheckout) {
    // Cancel the related order
    await cancelOrder(cancelledPayment._id as string);
    logger.info('Order record updated to cancelled');
  } else if (cancelledPayment.payment_type === PaymentType.Membership) {
    logger.info('Membership subscription cancelled');
  }

  // Notify the Pi platform that the payment has been cancelled
  await platformAPIClient.post(`/v2/payments/${ paymentId }/cancel`);
  logger.info('Successfully posted cancellation to Pi platform');

  return {
    success: true,
    message: `Payment cancelled with id ${ paymentId }`,
  };
};