import mongoose from "mongoose";
import Order from "../models/Order";
import OrderItem from "../models/orderItem";
import { IOrder, IOrderItem } from "../types";
import logger from "../config/loggingConfig";
import SellerItem from "../models/SellerItem";
import { OrderItemStatus } from "../models/enums/SellerItemStatus";

/**
 * Adds a new order or updates an existing one.
 * @param {string | null} orderId - Existing order ID (if updating).
 * @param {IOrder} orderData - Order details.
 * @param {IOrderItem[]} orderItems - List of order items.
 * @returns {Promise<IOrder>} - The newly created or updated order.
 */
export const addOrUpdateOrder = async (
  orderId: string | null,
  orderData: IOrder,
  orderItems: {itemId: string, quantity: number}[]
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let order;
    let sellerItem
    if (orderId) {
      // Update existing order
      order = await Order.findByIdAndUpdate(orderId, orderData, { new: true, session });
      if (!order) {
        throw new Error("Order not found");
      }
    } else {
      // Create new order
      order = new Order(orderData);
      await order.save({ session });
    }

    // Handle order items (add/update)
    for (const item of orderItems) {
      if (item.itemId) {
        sellerItem = await SellerItem.findById(item.itemId);
        if (!sellerItem) {
          console.log(`Seller item not found for ID: ${item.itemId}`)
          throw new Error(`Seller item not found for ID: ${item.itemId}`);
        }
        // Create new order item linked to the order
        const newItem = new OrderItem({
          order: order._id,
          seller_item: sellerItem._id, // Store only the ObjectId
          quantity: item.quantity,
          sub_total_amount: item.quantity * parseFloat(sellerItem?.price.toString()), // Corrected field
          status: OrderItemStatus.Pending,
        });
        sellerItem = await newItem.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    console.log('seller item: ', sellerItem);
    console.log('order: ', order);
    sellerItem
    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error("Error adding/updating order: ", error);
    throw new Error("Error processing order");
  }
};

export const getAllOrders = async (filters: Record<string, any>) => {
  try {
    // Construct query object based on provided filters
    const query: Record<string, any> = {};

    if (filters.status) {
      query.status = filters.status; // Filter by order status
    }
    if (filters.buyer) {
      query.buyer = filters.buyer; // Filter by buyer ID
    }
    if (filters.seller) {
      query.seller = filters.seller; // Filter by seller ID
    }
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      }; // Filter by date range
    }

    const orders = await Order.find(query);
    return orders;
  } catch (error) {
    logger.error("Error fetching orders with filters: ", error);
    throw new Error("Error fetching orders");
  }
};


export const getOrderById = async (orderId: string) => {
  try {
    return await Order.findById(orderId);
  } catch (error) {
    logger.error("Error fetching order: ", error);
    throw new Error("Error fetching order");
  }
};

export const deleteOrderById = async (orderId: string) => {
  try {
    return await Order.findByIdAndDelete(orderId);
  } catch (error) {
    logger.error("Error deleting order: ", error);
    throw new Error("Error deleting order");
  }
};

export const getOrderItems = async (orderId: string) => {
  try {
    // Fetch the base order
    const order = await Order.findById(orderId);
    if (!order) {
      return null; // Order not found
    }

    // Fetch the items linked to the order
    const orderItems = await OrderItem.find({ order: orderId })
      .populate("seller_item") // Populate seller item details
      .exec();

    return { order, items: orderItems };
  } catch (error) {
    logger.error(`Error fetching order and items for order ${orderId}: `, error);
    throw new Error("Error fetching order and items");
  }
};

