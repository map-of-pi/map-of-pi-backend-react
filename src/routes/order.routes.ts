import { Router } from "express";

import * as orderController from "../controllers/orderController";
import { isSellerFound } from "../middlewares/isSellerFound";
import { verifyToken } from "../middlewares/verifyToken";

const orderRoutes = Router();

orderRoutes.get("/seller-order", verifyToken, isSellerFound, orderController.getSellerOrders)
orderRoutes.get("/:order_id", orderController.getSingleOrder);
orderRoutes.post("/", verifyToken, orderController.addOrUpdateOrder);
orderRoutes.put("/:order_item_id", verifyToken, isSellerFound, orderController.updateOrderItemStatus);
orderRoutes.delete("/:order_id", verifyToken, orderController.deleteOrder);

export default orderRoutes;
