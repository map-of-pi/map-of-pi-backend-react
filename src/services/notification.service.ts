import Notification from "../models/Notification";
import { INotification } from "../types";
import logger from "../config/loggingConfig";

export const addNotification = async (pi_uid: string, reason: string): Promise<INotification> => {
  try {
    const notification = await Notification.create({pi_uid, reason, is_cleared: false});
    return notification as INotification;
  } catch (error: any) {
    logger.error(`Failed to add notification for piUID ${ pi_uid }: ${ error.message}`);
    throw error;
  }
};

export const getNotifications = async (pi_uid: string, skip = 0, limit = 20): Promise<INotification[]> => {
  try {
    const notifications = await Notification.find({ pi_uid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return notifications as INotification[];
  } catch (error: any) {
    logger.error(`Failed to get notifications for piUID ${ pi_uid }: ${error.message}`);
    throw error;
  }
};

export const updateNotification = async (id: string): Promise<INotification | null> => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      { _id: id },
      { is_cleared: true },
      { new: true }
    ).exec();

    return updatedNotification as INotification | null;
  } catch (error: any) {
    logger.error(`Failed to update notification for ID ${ id }: ${error.message}`);
    throw error;
  }
};