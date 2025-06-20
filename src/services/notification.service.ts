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

export const getNotifications = async (pi_uid: string, skip: number, limit: number): Promise<INotification[]> => {
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

export const clearNotification = async (id: string): Promise<INotification | null> => {
  try {
    const clearedNotification = await Notification.findByIdAndUpdate(
      { _id: id },
      { is_cleared: true },
      { new: true }
    ).exec();

    return clearedNotification as INotification | null;
  } catch (error: any) {
    logger.error(`Failed to clear notification for ID ${ id }: ${error.message}`);
    throw error;
  }
};