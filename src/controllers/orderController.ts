import { Request, Response } from "express";
import {
  getAllOrders,
  getOrderById,
  addOrUpdateOrder,
  deleteOrderById,
  getOrderItems,
} from "../services/order.service";
import logger from "../config/loggingConfig";

export const getAllOrdersController = async (req: Request, res: Response) => {
  try {
    const filters = req.query; // Extract filters from query params
    const orders = await getAllOrders(filters);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getSingleOrder = async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order: ", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const createOrUpdateOrderController = async (req: Request, res: Response) => {
  try {
    const { orderId, orderData, orderItems } = req.body;
    
    const updatedOrder = await addOrUpdateOrder(orderId, orderData, orderItems);
    res.status(200).json(updatedOrder);
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deletedOrder = await deleteOrderById(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    logger.error("Error deleting order: ", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

export const getOrderItemsController = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const result = await getOrderItems(orderId);

    if (!result) {
      return res.status(404).json({ message: "No items found for this order" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order items" });
  }
};
