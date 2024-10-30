import { NextFunction, Request, Response } from "express";

import UserSettings from "../models/UserSettings";
import { IUserSettings } from "../types";

import logger from '../config/loggingConfig'

declare module 'express-serve-static-core' {
  interface Request {
    currentUserSettings: IUserSettings;
  }
}

export const isUserSettingsFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userSettingsId = req.currentUser?.pi_uid;

  try {
    logger.info(`Checking if user settings exist for user ID: ${userSettingsId}`);
    const currentUserSettings: IUserSettings | null = await UserSettings.findOne({user_settings_id: userSettingsId});

    if (currentUserSettings) {
      req.currentUserSettings = currentUserSettings;
      logger.info(`User settings found for user ID: ${userSettingsId}`);
      return next();
    } else {
      logger.warn(`User settings not found for user ID: ${userSettingsId}`);
      return res.status(404).json({message: "User Settings not found"});
    }
  } catch (error) {
    logger.error('Failed to identify user settings:', error);
    res.status(500).json({ message: 'Failed to identify | user settings not found; please try again later'});
  }
};
