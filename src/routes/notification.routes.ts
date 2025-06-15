import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { verifyToken } from "../middlewares/verifyToken";

const notificationRoutes = Router();

notificationRoutes.post("/send", verifyToken, notificationController.sendNotification);
notificationRoutes.get("/get/:pi_uid", notificationController.getNotifications);
notificationRoutes.put("/update/:id", verifyToken, notificationController.updateNotifications);

export default notificationRoutes;