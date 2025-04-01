import mongoose from "mongoose";
import Order from "../models/Order";
import { IOrder } from "../types";
import logger from "../config/loggingConfig";
import SellerItem from "../models/SellerItem";
import OrderItem from "../models/orderItem";
import { OrderItemStatusType } from "../models/enums/orderItemStatusType";
import User from "../models/User";

/**
 * Adds a new order or updates an existing one.
 * @param {string | null} orderId - Existing order ID (if updating).
 * @param {IOrder} orderData - Order details.
 * @param {IOrderItem[]} orderItems - List of order items.
 * @returns {Promise<IOrder>} - The newly created or updated order.
 */
export const createOrder = async (
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

    // Handle order items
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
          status: OrderItemStatusType.Pending,
        });
        sellerItem = await newItem.save({ session });
      }
    }

    // use bulk item creation/update instead of

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

export const getSellerOrdersById = async (sellerId: string) => {
  try {
    // Fetch orders matching the seller_id and sorted in descending order
    const orders = await Order.find({ seller_id: sellerId }).sort({ updatedAt: -1 }).lean();

    // Extract all unique buyer `pi_uid`s from the orders
    const buyerPiUids = [...new Set(orders.map((order) => order.buyer_id))];

    // Fetch user details using `pi_uid`
    const users = await User.find({ pi_uid: { $in: buyerPiUids } })
      .select("pi_uid pi_username")
      .lean();

    // Create a lookup object for quick access
    const userLookup = users.reduce((acc, user) => {
      acc[user.pi_uid] = user.pi_username;
      return acc;
    }, {} as Record<string, string>);

    // Attach `pi_username` to each order
    const ordersWithUsernames = orders.map((order) => ({
      ...order,
      pi_username: userLookup[order.buyer_id] || null, // Attach username if found
    }));

    console.log("Fetched orders: ", ordersWithUsernames.length);
    return ordersWithUsernames;
  } catch (error) {
    logger.error("Error fetching seller orders: ", error);
    throw new Error("Error fetching orders");
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
    let order = await Order.findById(orderId);
    if (!order) {
      return null; // Order not found
    }

    // Fetch the user's pi_username based on buyer_id matching pi_uid
    const user = await User.findOne({ pi_uid: order.buyer_id }, "pi_username");

    // Fetch the items linked to the order
    const orderItems = await OrderItem.find({ order_id: orderId })
    .populate({ path: "seller_item_id", model: "Seller-Item" }) // Populate seller item details
      .exec();
    logger.info('fetched order items: ', orderItems);
    return { 
      order, 
      orderItems: orderItems, 
      pi_username: user ? user.pi_username : ''  
    };
  } catch (error) {
    logger.error(`Error fetching order and items for order ${orderId}: `, error);
    throw new Error("Error fetching order and items");
  }
};

export const updateOrderItemStatus = async (itemId: string, itemStatus: string) => {
  try {
    const updatedItem = await OrderItem.findByIdAndUpdate(itemId, {
      status: itemStatus,
      updatedAt: new Date()
    }, {new: true}).exec();
    if (!updatedItem) return null 
    return updatedItem
  }catch (error:any){
    logger.error(`Error updating order item for order ${itemId}: `, error);
    throw new Error("Error updating order item");
  }
  
}

