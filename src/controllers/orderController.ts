import { Request, Response } from "express";
import *  as orderService from "../services/order.service";
import logger from "../config/loggingConfig";

export const getSellerOrders = async (req: Request, res: Response) => {
  const seller = req.currentSeller; 
  try {
    const orders = await orderService.getSellerOrdersById(seller.seller_id);
    res.status(200).json(orders);
  } catch (error) {
    logger.error(`Failed to get seller orders for sellerID ${ seller.seller_id }:`, error);
    return res.status(500).json({ message: 'An error occurred while fetching seller orders; please try again later' });
  }
};

export const getSingleOrder = async (req: Request, res: Response) => {
  const { order_id } = req.params;
  try {
    const currentOrder = await orderService.getOrderItems(order_id);
    if (!currentOrder) {
      logger.warn(`Order with ID ${order_id} not found.`);
      return res.status(404).json({ message: "Order not found" });
    }
    logger.info(`Fetched order with ID ${order_id}`);
    res.status(200).json(currentOrder);
  } catch (error) {
    logger.error(`Failed to get single order for orderID ${ order_id }:`, error);
    return res.status(500).json({ message: 'An error occurred while fetching single order; please try again later' });
  }
};

export const addOrUpdateOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, orderData, orderItems } = req.body;
    // Add or update Order
    const updatedOrder = await orderService.addOrUpdateOrder(orderId, orderData, orderItems);
    return res.status(200).json(updatedOrder);
  } catch (error) {
    logger.error('Failed to add or update order:', error);
    return res.status(500).json({
      message: 'An error occurred while adding/ updating order; please try again later',
    });
  }
};

export const updateOrderItemStatus = async (req: Request, res: Response) => {
  const { order_item_id } = req.params;
  try {
    const itemStatus = req.body.itemStatus;
    logger.info('New order item status: ', itemStatus);
    const orderItem = await orderService.updateOrderItemStatus(order_item_id, itemStatus);
    logger.info('Updated order item: ', orderItem)
    return res.status(200).json(orderItem);
  } catch (error) {
    logger.error('Failed to update order item status:', error);
    return res.status(500).json({
      message: 'An error occurred while updating order item status; please try again later',
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const { order_id } = req.params;
  try {
    const deletedOrder = await orderService.deleteOrderById(order_id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    logger.info(`Deleted order with ID ${order_id}`);
    res.status(200).json({ message: "Order deleted successfully", deletedOrder: deletedOrder });
  } catch (error) {
    logger.error(`Failed to delete order for orderID ${ order_id }:`, error);
    return res.status(500).json({ message: 'An error occurred while deleting order; please try again later' });
  }
};
