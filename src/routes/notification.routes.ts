import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { verifyToken } from "../middlewares/verifyToken";

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationSchema:
 *       type: object
 *       properties:
 *         pi_uid:
 *           type: string
 *           description: Pi user ID associated with the notification
 *         is_cleared:
 *           type: boolean
 *           description: Current status of the notification
 *         reason:
 *           type: string
 *           description: Details on the reason for the notification
 */
const notificationRoutes = Router();

notificationRoutes.post("/send", verifyToken, notificationController.createNotification);
notificationRoutes.get("/get/:pi_uid", notificationController.getNotifications);
notificationRoutes.put("/update/:id", verifyToken, notificationController.clearNotification);

export default notificationRoutes;