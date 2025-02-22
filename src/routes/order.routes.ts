import express from "express";
import {
  getAllOrdersController,
  getSingleOrder,
  createOrUpdateOrderController,
  deleteOrder,
  getOrderItemsController,
} from "../controllers/orderController";
import { verifyToken } from "../middlewares/verifyToken";

const router = express.Router();

router.get("/", getAllOrdersController);
router.get("/:id", getSingleOrder);
router.post("/", verifyToken, createOrUpdateOrderController);
router.delete("/:id", verifyToken, deleteOrder);
router.get("/:id/items", getOrderItemsController); // Route for fetching order items

export default router;
