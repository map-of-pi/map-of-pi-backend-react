import mongoose from "mongoose";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Seller from "../models/Seller";
import SellerItem from "../models/SellerItem";
import User from "../models/User";
import { OrderStatusType } from "../models/enums/orderStatusType";
import { OrderItemStatusType } from "../models/enums/orderItemStatusType";
import { IOrder, NewOrder, PickedItems } from "../types";
import logger from "../config/loggingConfig";

export const createOrder = async (
  orderData: NewOrder,
  orderItems: PickedItems[]
): Promise<IOrder> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* Step 1: Create a new Order record */
    const order = new Order({
      buyer_id: orderData.buyerId,
      seller_id: orderData.sellerId,
      payment_id: orderData.paymentId,
      total_amount: orderData.totalAmount,
      status: orderData.status,
      is_paid: false,
      is_fulfilled: false,
      fulfillment_method: orderData.fulfillmentMethod,
      seller_fulfillment_description: orderData.sellerFulfillmentDescription,
      buyer_fulfillment_description: orderData.buyerFulfillmentDescription, 
    });
    const newOrder = await order.save({ session });

    if (!newOrder) {
      logger.error('Failed to create order; save returned null');
      throw new Error('Failed to create order');
    }
    logger.debug('Order created successfully', { orderId: newOrder._id });

    /* Step 2: Fetch all SellerItem documents associated with the order */
    const sellerItemIds = orderItems.map((item) => item.itemId);
    const sellerItems = await SellerItem.find({ _id: { $in: sellerItemIds } }).lean();

    // Build a lookup map for seller items
    const sellerItemLookup = sellerItems.reduce((acc, sellerItem) => {
      acc[sellerItem._id.toString()] = sellerItem;
      return acc;
    }, {} as Record<string, any>);

    /* Step 3: Build OrderItem documents for bulk insertion */
    const bulkOrderItems = orderItems.map((item) => {
      const sellerItem = sellerItemLookup[item.itemId];
      if (!sellerItem) {
        logger.error(`Failed to find seller item for ID: ${ item.itemId }`);
        throw new Error('Failed to find associated seller item');
      }

      return {
        order_id: newOrder._id,
        seller_item_id: sellerItem._id, // Store only the ObjectId
        quantity: item.quantity,
        subtotal: item.quantity * parseFloat(sellerItem.price.toString()),
        status: OrderItemStatusType.Pending,
      };
    });

    /* Step 4: Insert order items in bulk */
    await OrderItem.insertMany(bulkOrderItems, { session });
    logger.debug('Order items inserted successfully', { count: bulkOrderItems.length });

    /* Step 5: Commit the transaction */
    await session.commitTransaction();

    logger.info('Order and associated items created successfully', { orderId: newOrder._id });
    return newOrder;
  } catch (error: any) {
    /* Step 6: Roll back transaction on failure */
    await session.abortTransaction();

    logger.error(`Failed to create order: ${ error }`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const updatePaidOrder = async (paymentId: string): Promise<IOrder> => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      {payment_id: paymentId}, 
      { 
        $set: {
          is_paid: true,
          status: OrderStatusType.Pending
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedOrder) {
      logger.error(`Failed to update paid order for payment ID ${ paymentId }`);
      throw new Error('Failed to update paid order');
    }
    return updatedOrder;

  } catch (error: any) {
    logger.error(`Failed to update paid order for paymentID ${ paymentId }: ${ error }`);
    throw error;
  }  
};

export const getSellerOrdersById = async (piUid: string) => {
  try {
    const seller = await Seller.exists({ seller_id: piUid });
    if (!seller) {
      logger.warn(`Seller not found for Pi UID: ${ piUid }`);
      return [];
    }

    const orders = await Order.find({ seller_id: seller?._id, is_paid: true })
      .populate('buyer_id', 'pi_username -_id') // Populate buyer_id with pi_username
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .lean();
    return orders;

  } catch (error: any) {
    logger.error(`Failed to get seller orders for Pi UID ${ piUid }: ${ error }`);
    throw error;
  }
};

export const getBuyerOrdersById = async (piUid: string) => {
  try {
    const buyer = await User.exists({ pi_uid: piUid });
    if (!buyer) {
      logger.warn(`Buyer not found for Pi UID: ${ piUid }`);
      return [];
    }

    const orders = await Order.find({ buyer_id: buyer?._id, is_paid: true })
      .populate('seller_id', 'name -_id') // Populate seller_id with pi_username
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .lean();
    return orders;

  } catch (error: any) {
    logger.error(`Failed to get buyer orders for Pi UID ${ piUid }: ${ error }`);
    throw error;
  }
};

export const deleteOrderById = async (orderId: string) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      logger.error(`Order not found to delete for orderID: ${ orderId }`);
      return null;
    }
    return deletedOrder;
  } catch (error: any) {
    logger.error(`Failed to delete order for orderID ${ orderId }: ${ error }`);
    throw error;
  }
};

export const getOrderItems = async (orderId: string) => {
  try {
    // Fetch the base order and handle not found case
    const order = await Order.findById(orderId)
      .populate('seller_id', 'name -_id')
      .lean();
    
    if (!order) {
      logger.warn(`Order items not found for orderID: ${ orderId }`);
      return null; // Order not found
    }

    // Fetch the user's pi_username based on buyer_id matching pi_uid
    const user = await User.findById(order.buyer_id, "pi_username");

    // Fetch the items linked to the order
    const orderItems = await OrderItem.find({ order_id: orderId })
      .populate({ path: "seller_item_id", model: "Seller-Item" })
      .lean();

    logger.info(`Fetched ${ orderItems.length } order items for orderID ${ orderId }`);
    
    const result = orderItems.map(item => ({
      ...item,
      seller_item: item.seller_item_id,
    }));

    return { 
      order, 
      orderItems: result, 
      pi_username: user?.pi_username || '',  
    };
  } catch (error: any) {
    logger.error(`Failed to get order items for orderID ${ orderId }: ${ error }`);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string, 
  orderStatus: OrderStatusType
) => {
  try {
    // Handle specific order statuses
    if (orderStatus === OrderStatusType.Completed) {
      const orderItems = await OrderItem.find({ order_id: orderId }).exec();

      if (orderItems.length > 0) {
        await OrderItem.updateMany(
          { _id: { $in: orderItems.map(item => item._id) } },
          { status: OrderItemStatusType.Fulfilled }
        ).exec();
        logger.info(`Marked ${ orderItems.length } order items as fulfilled for orderID ${ orderId }`);
      } else {
        logger.warn(`No order items found to mark as fulfilled for orderID ${ orderId }`);
      }
    } else {
      logger.warn(`Unhandled order status type: ${ orderStatus } for orderID ${ orderId }`);
    }

    // Update the main order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      { status: orderStatus },
      { new: true }
    ).exec();

    if (!updatedOrder) {
      logger.error(`Order not found or failed to update status for orderID ${ orderId }`);
      return null;
    }

    return updatedOrder;
  } catch (error: any) {
    logger.error(`Failed to update order status for orderID ${ orderId }: ${ error }`);
    throw error;
  }  
};

export const updateOrderItemStatus = async (
  itemId: string, 
  itemStatus: string
) => {
  try {
    const updatedItem = await OrderItem.findByIdAndUpdate(
      itemId, 
      { status: itemStatus }, 
      { new: true }
    ).exec();

    if (!updatedItem) {
      logger.error(`Order item not found or failed to update for itemId: ${ itemId }`);
      return null;
    }

    logger.info(`Order item ${ itemId } updated to status "${ itemStatus }"`);
    return updatedItem;
  } catch (error: any) {
    logger.error(`Failed to update order item status for orderItemID ${ itemId }: ${ error }`);
    throw error;
  }
};

export const cancelOrder = async (paymentId: string) => {
  try {
    const cancelledOrder = await Order.findOneAndUpdate(
      { payment_id: paymentId }, 
      { 
        is_paid: false,
        status: OrderStatusType.Cancelled
      },
      { new: true } 
    ).exec();

    if (!cancelledOrder) {
      logger.error(`Failed to cancel order for paymentID ${ paymentId }`);
      throw new Error("Failed to cancel order");
    } 

    logger.info(`Order with paymentID ${ paymentId } successfully cancelled.`);
    return cancelledOrder;
  } catch (error:any) {
    logger.error(`Failed to cancel order for paymentID ${ paymentId }: ${ error }`);
    throw error;
  }
};