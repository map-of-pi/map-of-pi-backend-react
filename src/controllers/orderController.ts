import { Request, Response } from "express";
import *  as orderService from "../services/order.service";
import logger from "../config/loggingConfig";

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const filters = req.query; // Extract filters from query params
    const orders = await orderService.getAllOrders(filters);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getSellerOrders= async (req: Request, res: Response) => {
  try {
    const seller = req.currentSeller; 

    const orders = await orderService.getSellerOrders(seller.seller_id);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getSingleOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id
    console.log('order Id: ', orderId)
    const order = await orderService.getOrderItems(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order: ", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const createOrUpdateOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, orderData, orderItems } = req.body;
    
    const updatedOrder = await orderService.addOrUpdateOrder(orderId, orderData, orderItems);
    res.status(200).json(updatedOrder);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deletedOrder = await orderService.deleteOrderById(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    logger.error("Error deleting order: ", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

export const getOrderItems = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const result = await orderService.getOrderItems(orderId);

    if (!result) {
      return res.status(404).json({ message: "No items found for this order" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order items" });
  }
};

export const updateOrderItemStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemStatus } = req.body;

    if (!id || !itemStatus) {
      return res.status(400).json({ message: "Order item ID and status are required" });
    }

    logger.info(`Order item ID: ${id}`);
    logger.info(`New order item status: ${itemStatus}`);

    const orderItem = await orderService.updateOrderItemStatus(id, itemStatus);

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }

    logger.info(`Updated order item: ${JSON.stringify(orderItem)}`);

    return res.status(200).json(orderItem);
  } catch (error) {
    console.error("Error updating order item:", error);
    return res.status(500).json({ message: "Failed to update order item" });
  }
};
