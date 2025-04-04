import { Router } from "express";

import * as orderController from "../controllers/orderController";
import { verifyToken } from "../middlewares/verifyToken";
import { isSellerFound } from "../middlewares/isSellerFound";

const orderRoutes = Router();

// orderRoutes.get("/", orderController.getOrderItems);
orderRoutes.get("/seller-order", verifyToken, isSellerFound, orderController.getSellerOrders)
orderRoutes.get("/:id", verifyToken, orderController.getSingleOrder);
orderRoutes.post("/", verifyToken, orderController.createOrder);
orderRoutes.delete("/:id", verifyToken, orderController.deleteOrder);
orderRoutes.put("/complete/:id", verifyToken, orderController.updateCompleteOrder);
orderRoutes.put("/:id", verifyToken, isSellerFound, orderController.updateOrderItemStatus);

export default orderRoutes;
