import logger from "../config/loggingConfig";
import { FulfillmentType } from "../models/enums/fulfillmentType";
import { OrderStatusType } from "../models/enums/orderStatusType";
import { PaymentType } from "../models/enums/paymentType";
import Seller from "../models/Seller";
import User from "../models/User";
import { createOrder } from "../services/order.service";
import { createPayment } from "../services/payment.service";
import { IUser, PaymentDataType } from "../types";



const OrderCheckout = async (piPaymentId: string, authUser:IUser, currentPayment:PaymentDataType) => {
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

export default OrderCheckout