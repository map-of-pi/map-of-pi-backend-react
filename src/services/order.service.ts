import mongoose from "mongoose";
import Order from "../models/Order";
import { IOrder, PickedItems } from "../types";
import logger from "../config/loggingConfig";
import SellerItem from "../models/SellerItem";
import OrderItem from "../models/orderItem";
import { OrderItemStatusType } from "../models/enums/orderItemStatusType";
import User from "../models/User";
import Seller from "../models/Seller";
import { StringDecoder } from "string_decoder";
import { OrderStatusType } from "../models/enums/orderStatusType";


export const createOrder = async (
  orderData: Partial<IOrder>,
  orderItems: PickedItems[]
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create new order
    const order = new Order(orderData);
    const newOrder = await order.save({ session });

    // Fetch all seller items in bulk
    const sellerItemIds = orderItems.map((item) => item.itemId);
    const sellerItems = await SellerItem.find({ _id: { $in: sellerItemIds } }).lean();

    // Create a lookup for seller items
    const sellerItemLookup = sellerItems.reduce((acc, sellerItem) => {
      acc[sellerItem._id.toString()] = sellerItem;
      return acc;
    }, {} as Record<string, any>);

    // Prepare bulk order items
    const bulkOrderItems = orderItems.map((item) => {
      const sellerItem = sellerItemLookup[item.itemId];
      if (!sellerItem) {
        throw new Error(`Seller item not found for ID: ${item.itemId}`);
      }

      return {
        order_id: newOrder._id,
        seller_item_id: sellerItem._id, // Store only the ObjectId
        quantity: item.quantity,
        subtotal: item.quantity * parseFloat(sellerItem.price.toString()),
        status: OrderItemStatusType.Pending,
      };
    });

    // Insert all order items in bulk
    await OrderItem.insertMany(bulkOrderItems, { session });

    await session.commitTransaction();
    session.endSession();

    return newOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error("Error adding/updating order: ", error);
    throw new Error("Error processing order");
  }
};

export const updatePaidOrder = async (paymentId:string, updateData:Partial<IOrder>): Promise<IOrder | null> => {
  try {
    const updatedOrder = await Order.findOneAndUpdate({payment_id: paymentId}, updateData, { new: true }).exec();
    if (!updatedOrder) {
      logger.error(`Failed to update order for payment ID ${paymentId}`);
      return null
    }
    return updatedOrder
  } catch (error:any) {
    logger.error(`Error updating order for payment ID ${paymentId}: `, error);
    return null
  }  
}

export const getSellerOrdersById = async (piUid:string) => {
    try {
      const seller = await Seller.exists({seller_id: piUid});
      const orders = await Order.find({seller_id: seller?._id, is_paid: true})
        .populate('buyer_id', 'pi_username -_id') // Populate buyer_id with pi_username
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .lean();
      return orders;
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        throw error;
    }
}

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
    let order = await Order.findById(orderId).lean();
    if (!order) {
      return null; // Order not found
    }

    // Fetch the user's pi_username based on buyer_id matching pi_uid
    const user = await User.findById(order.buyer_id, "pi_username");

    // Fetch the items linked to the order
    const orderItems = await OrderItem.find({ order_id: orderId })
    .populate({ path: "seller_item_id", model: "Seller-Item" }) // Populate seller item details
      .exec();
    logger.info('fetched order items: ', orderItems.length);
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

export const completeOrder = async (orderId: string) => {
  try {
    // update all related order items status to completed
    const orderItems = await OrderItem.find({ order_id: orderId }).exec();
    const orderItemIds = orderItems.map((item) => item._id);
    await OrderItem.updateMany(
      { _id: { $in: orderItemIds } },
      { status: OrderItemStatusType.Fulfilled },
      { new: true }
    ).exec();
    
    // update order status to completed
    const updatedOrder = await Order.findByIdAndUpdate(orderId, {
      status: OrderStatusType.Completed
    }, {new: true}).exec();
    if (!updatedOrder) return null
    const orders = await getOrderItems(orderId)
    return { 
      ...orders 
    };
  }catch (error:any){
    logger.error(`Error updating order item for order ${orderId}: `, error);
    throw new Error("Error updating order item");
  }  
}

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

