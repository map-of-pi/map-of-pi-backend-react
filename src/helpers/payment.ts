import axios from 'axios';
import { platformAPIClient } from '../config/platformAPIclient';
import Seller from '../models/Seller';
import User from '../models/User';
import { OrderStatusType } from '../models/enums/orderStatusType';
import { PaymentType } from "../models/enums/paymentType";
import { U2UPaymentStatus } from '../models/enums/u2uPaymentStatus';
import { 
  cancelOrder, 
  createOrder, 
  updatePaidOrder 
} from '../services/order.service';
import { 
  getPayment, 
  createPayment, 
  completePayment, 
  createPaymentCrossReference,
  cancelPayment,
  getxRefByOrderId
} from '../services/payment.service';
import { IUser, NewOrder, PaymentDataType, PaymentDTO, PaymentInfo } from '../types';
import logger from '../config/loggingConfig';
import { enqueuePayment } from '../utils/queues/queue';

function buildPaymentData(
  piPaymentId: string,
  buyerId: string,
  payment: PaymentDataType
) {
  return {
    piPaymentId,
    userId: buyerId,
    memo: payment.memo,
    amount: payment.amount,
    paymentType: PaymentType.BuyerCheckout
  };
}

function buildOrderData(
  buyerId: string,
  sellerId: string,
  paymentId: string,
  payment: PaymentDataType
) {
  const orderMeta = payment.metadata.OrderPayment!; // safe due to earlier guard

  return {
    buyerId,
    sellerId,
    paymentId,
    totalAmount: payment.amount,
    status: OrderStatusType.Initialized,
    fulfillmentMethod: orderMeta.fulfillment_method,
    sellerFulfillmentDescription: orderMeta.seller_fulfillment_description,
    buyerFulfillmentDescription: orderMeta.buyer_fulfillment_description,
  };
}

const checkoutProcess = async (
  piPaymentId: string, 
  authUser: IUser, 
  currentPayment: PaymentDataType
) => {

  // Extract OrderPayment metadata from the current payment
  const { OrderPayment } = currentPayment.metadata;
  // Validate presence of required OrderPayment metadata
  if (!OrderPayment) {
    logger.error("OrderPayment metadata is missing");
    throw new Error("OrderPayment metadata is missing");
  }

  // Look up the seller and buyer in the database
  const seller = await Seller.findOne({ seller_id: OrderPayment.seller });
  const buyer = await User.findOne({ pi_uid: authUser?.pi_uid });

  if (!buyer || !seller) {
    logger.error("Seller or buyer not found", { sellerId: OrderPayment.seller, buyerId: authUser?.pi_uid });
    throw new Error("Seller or buyer not found");
  }

  // Construct payment data object for recording the transaction
  const paymentData = buildPaymentData(piPaymentId, buyer._id as string, currentPayment);
  // Create a new payment record
  const newPayment = await createPayment(paymentData)
  // Validate payment record creation succeeded
  if (!newPayment) {
    logger.error("Unable to create payment record")
    throw new Error("Unable to create payment record");
  }

  // Ensure order items are present
  if (!OrderPayment.items) {
    logger.error("Order items not found in OrderPayment metadata");
    throw new Error("Order items not found in OrderPayment metadata");
  }

  // Construct order data object
  const orderData = buildOrderData(
    buyer._id as string,
    seller._id as string,
    newPayment._id as string,
    currentPayment
  )
  // Create a new order along with its items
  const newOrder = await createOrder(orderData as NewOrder, OrderPayment.items);

  logger.info('order created successfully', { orderId: newOrder._id });
  return newOrder;
}

export const processIncompletePayment = async (payment: PaymentInfo) => {
  try {
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;

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
      const updatedOrder = await updatePaidOrder(updatedPayment._id as string);
      logger.warn("Old order found and updated");

      // update the payment cross-reference if it exists else create a new one
      const xRef = getxRefByOrderId(updatedOrder._id as string);

      if (!xRef) {
        logger.warn("No existing payment cross-reference found, creating a new one");
        const xRefData = {
          orderId: updatedOrder._id as string,
          u2aPaymentId: updatedPayment._id as string,
          u2uStatus: U2UPaymentStatus.U2ACompleted,
          u2aCompletedAt: new Date(),
          a2uPaymentId: null,
          sellerId: updatedPayment.user_id.toString(),
        }
        const newXref = await createPaymentCrossReference(xRefData);

        // Enqueue the payment for further processing (e.g., A2U payment)
        await enqueuePayment(newXref?._id.toString(), updatedOrder?.seller_id.toString(), updatedOrder.total_amount.toString(), updatedPayment.memo);
      } 
    }    

    // Notify the Pi Platform that the payment is complete
    await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });

    return {
      success: true,
      message: `Payment completed from incomplete payment with id ${ paymentId }`,
    };
  } catch (error: any) {
    if (error.response) {
      logger.error("platformAPIClient error", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error("Unhandled error during incomplete payment processing", { message: error.message, stack: error.stack });
    }
    throw(error);
  }
};

export const processPaymentApproval = async (
  paymentId: string,
  currentUser: IUser
): Promise<{ success: boolean; message: string }> => {
  try {
    // Fetch payment details from the Pi platform using the payment ID
    const res = await platformAPIClient.get(`/v2/payments/${ paymentId }`);
    const currentPayment: PaymentDataType = res.data;

    // Check if a payment record with this ID already exists in the database
    const oldPayment = await getPayment(res.data.identifier);
    if (oldPayment) {
      logger.info("Payment record already exists: ", oldPayment._id);

      return {
        success: false,
        message: `Payment already exists with ID ${ paymentId }`,
      };
    }

    // Handle logic based on the payment type
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
  } catch (error: any) {
    if (error.response) {
      logger.error("platformAPIClient error", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error("Unhandled error during payment approval", { message: error.message, stack: error.stack });
    }
    throw(error);
  }
};

export const processPaymentCompletion = async (paymentId: string, txid: string) => {
  try {
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
        orderId: order._id as string,
        u2aCompletedAt: new Date(),
        a2uPaymentId: null,
      };
      const xRef = await createPaymentCrossReference(u2uRefData);
      logger.info("U2U cross-reference created", u2uRefData); 
      
      // Enqueue the payment for further processing (e.g., A2U payment)
      await enqueuePayment(xRef?._id.toString(), order?.seller_id.toString(), order.total_amount.toString(), completedPayment.memo);

      // Notify Pi Platform of successful completion
      const completedPiPayment = await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });
      
      if (completedPiPayment.status !== 200) {
        throw new Error("Failed to mark U2A payment completed on Pi blockchain");
      }

      logger.info("Payment marked completed on Pi blockchain", completedPiPayment.status);

    } else if (completedPayment?.payment_type === PaymentType.Membership) {
      // Notify Pi platform for membership payment completion
      await platformAPIClient.post(`/v2/payments/${ paymentId }/complete`, { txid });
      logger.info("Membership subscription completed");
    }

    return {
      success: true,
      message: `Payment completed with id ${ paymentId }`,
    };
  } catch (error: any) {
    if (error.response) {
      logger.error("platformAPIClient error", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error("Unhandled error during payment completion", { message: error.message, stack: error.stack });
    }
    throw(error);
  }
}; 

export const processPaymentCancellation = async (paymentId: string) => {
  try {
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
  } catch (error: any) {
    if (error.response) {
      logger.error("platformAPIClient error", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error("Unhandled error during payment cancellation", { message: error.message, stack: error.stack });
    }
    throw(error);
  }
};

export const processPaymentError = async (paymentDTO: PaymentDTO) => {
  try {
    // handle existing payment
    const transaction = paymentDTO.transaction;
    const paymentId = paymentDTO.identifier;

    if (transaction) {        
      const PaymentData = {
        identifier: paymentId,
        transaction: {
          txid: transaction.txid,
          _link: transaction._link,
        }
      };
      await processIncompletePayment(PaymentData);
      return {
        success: true,
        message: `Payment Error with ID ${paymentId} handled and completed successfully`,
      };
    } else {
      logger.warn("No transaction data found for existing payment");
      await processPaymentCancellation(paymentId);
      return {
        success: true,
        message: `Payment Error with ID ${paymentId} cancelled successfully`,
      };
    }
  } catch (error: any) {
    if (error.response) {
      logger.error("platformAPIClient error", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      logger.error("Unhandled error during handling payment error", { message: error.message, stack: error.stack });
    }
    throw(error);
  }
};