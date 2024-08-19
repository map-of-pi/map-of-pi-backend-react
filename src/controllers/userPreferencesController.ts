import { Request, Response } from "express";

import * as userSettingsService from '../services/userSettings.service';
import { IUserSettings } from '../types';

import logger from '../config/loggingConfig';

export const getUserPreferences = async (req: Request, res: Response) => {
  const { user_settings_id } = req.params;
  try {
    const userPreferences: IUserSettings | null = await userSettingsService.getUserSettingsById(user_settings_id);
    if (!userPreferences) {
      logger.warn(`User Preferences not found for ID: ${user_settings_id}`);
      return res.status(404).json({ message: "User Preferences not found" });
    }
    logger.info(`Fetched User Preferences for ID: ${user_settings_id}`);
    res.status(200).json(userPreferences);
  } catch (error: any) {
    logger.error(`Failed to fetch User Preferences for ID ${user_settings_id}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const fetchUserPreferences = async (req: Request, res: Response) => {
  try {
    const currentUserPreferences = req.currentUserSettings;
    if (!req.currentUser || !currentUserPreferences) {
      logger.warn(`User Preferences not found for user with ID: ${req.currentUser?.pi_uid || "NULL"}`);
      return res.status(404).json({ message: "User Preferences not found" });
    }
    logger.info(`Fetched User Preferences for user with ID: ${req.currentUser.pi_uid}`);
    res.status(200).json(currentUserPreferences);

  } catch (error: any) {
    logger.error(`Failed to fetch User Preferences for user with ID ${req.currentUser?.pi_uid}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const addUserPreferences = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser
    if (authUser) {
      const userSettingsData = JSON.parse(req.body.json);
      const userPreferences = await userSettingsService.addOrUpdateUserSettings(userSettingsData, authUser);
      logger.info(`Added or updated User Preferences for user with ID: ${authUser.pi_uid}`);
      res.status(200).json({ settings: userPreferences });
    }    
  } catch (error: any) {
    logger.error(`Failed to add or update User Preferences for user with ID ${req.currentUser?.pi_uid}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
