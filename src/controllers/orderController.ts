import { Request, Response } from "express";
import *  as orderService from "../services/order.service";
import { ISeller, IUser } from "../types";
import logger from "../config/loggingConfig";
import { OrderItemStatusType } from "../models/enums/orderItemStatusType";

export const getSellerOrders= async (req: Request, res: Response) => {
  const seller = req.currentSeller as ISeller; 
  try {
    const orders = await orderService.getSellerOrdersById(seller.seller_id);
    return res.status(200).json(orders);
  } catch (error) {
    logger.error(`Failed to get seller orders for sellerID ${ seller.seller_id }:`, error);
    return res.status(500).json({ 
      message: 'An error occurred while getting seller orders; please try again later' 
    });
  }
};

export const getBuyerOrders= async (req: Request, res: Response) => {
  const buyer = req.currentUser as IUser;
  try {
    const orders = await orderService.getBuyerOrdersById(buyer.pi_uid);
    return res.status(200).json(orders);
  } catch (error) {
    logger.error(`Failed to get buyer orders for piUID ${ buyer.pi_uid }:`, error);
    return res.status(500).json({ 
      message: 'An error occurred while getting buyer orders; please try again later' 
    });
  }
};

export const getSingleOrder = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  try {
    const order = await orderService.getOrderItems(orderId);
    if (!order) {
      logger.warn(`Order with ID ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found" });
    }
    logger.info(`Fetched order with ID ${orderId}`);
    return res.status(200).json(order);
  } catch (error) {
    logger.error(`Failed to get single order for orderID ${ orderId }:`, error);
    return res.status(500).json({ 
      message: 'An error occurred while getting single order; please try again later' 
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { orderId, orderData, orderItems } = req.body;
  try {
    const updatedOrder = await orderService.createOrder(orderData, orderItems);
    return res.status(201).json(updatedOrder);
  } catch (error) {
    logger.error(`Failed to create order for orderID ${ orderId }:`, error);
    return res.status(500).json({ 
      message: 'An error occurred while creating order; please try again later'
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deletedOrder = await orderService.deleteOrderById(req.params.id);
    if (!deletedOrder) {
      logger.warn(`Order not found.`);
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Order deleted successfully", deletedOrder });
  } catch (error) {
    logger.error(`Failed to delete order`, error);
    return res.status(500).json({ message: 'An error occurred while deleting order; please try again later' });
  }
};

export const getOrderItems = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  try {
    const items = await orderService.getOrderItems(orderId);

    if (!items) {
      logger.error(`No items are found for order: ${orderId}`);
      return res.status(404).json({ message: "No items found for this order" });
    }
    return res.status(200).json(items);
  } catch (error) {
    logger.error('Failed to fetch order items:', error);
    return res.status(500).json({ message: 'An error occurred while getting order items; please try again later' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderStatus } = req.body;
  try {
    const updatedOrder = await orderService.updateOrderStatus(id, orderStatus);
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found or could not be updated" });
    }
    const orderDetails = await orderService.getOrderItems(id);
    return res.status(200).json(orderDetails);
  } catch (error) {
    logger.error('Failed to update order status:', error);
    return res.status(500).json({ message: 'An error occurred while updating order status; please try again later' });
  }
};

export const updateOrderItemStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderItemStatus } = req.body;
  try {
    if (!id || !orderItemStatus) {
      return res.status(400).json({ message: 'Order item ID and order item status are required' });
    }
    if (!Object.values(OrderItemStatusType).includes(orderItemStatus)) {
      return res.status(400).json({ message: 'Invalid order item status' });
    }

    const updatedOrderItem = await orderService.updateOrderItemStatus(id, orderItemStatus);
    if (!updatedOrderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }
    return res.status(200).json(updatedOrderItem);
  } catch (error) {
    logger.error('Failed to update order item status:', error);
    return res.status(500).json({ message: 'An error occurred while updating order item status; please try again later' });
  }
};