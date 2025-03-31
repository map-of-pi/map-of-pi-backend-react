import { Router } from "express";

import * as orderController from "../controllers/orderController";
import { verifyToken } from "../middlewares/verifyToken";
import { isSellerFound } from "../middlewares/isSellerFound";

const orderRoutes = Router();

orderRoutes.get("/", orderController.getAllOrders);
orderRoutes.get("/seller-order", verifyToken, isSellerFound, orderController.getSellerOrders)
orderRoutes.get("/:id", orderController.getSingleOrder);
orderRoutes.post("/", verifyToken, orderController.createOrder);
orderRoutes.delete("/:id", verifyToken, orderController.deleteOrder);
orderRoutes.get("/:id/items", orderController.getOrderItems);
orderRoutes.put("/:id", verifyToken, isSellerFound, orderController.updateOrderItemStatus);

export default orderRoutes;
