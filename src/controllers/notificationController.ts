import { Request, Response } from "express";
import Notification from "../models/Notification";

export const sendNotification = async (req: Request, res: Response) => {
  const { reason } = req.body;
  const authUser = req.currentUser;

  try {
    const notification = await Notification.create({
      pi_uid: authUser?.pi_uid,
      reason,
      is_cleared: false,
    });

    console.log("Notification sent:", notification);

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  const { pi_uid } = req.params;
  const { skip, limit } = req.query;
  try {
    const notifications = await Notification.find({ pi_uid }).sort({createdAt: -1}).skip(Number(skip)).limit(Number(limit)).exec();
    if (!notifications) {
      return res.status(200).json([]);
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const updateNotifications = async (req: Request, res: Response) => {
  const { id } = req.params;
  // const { is_cleared } = req.body;

  try {
    const notification = await Notification.findByIdAndUpdate({
      _id: id,
    }, { is_cleared: true }, { new: true }).exec();
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    console.log("Notification updated:", notification);
    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};
