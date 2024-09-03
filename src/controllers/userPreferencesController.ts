import { Request, Response } from "express";

import * as userSettingsService from "../services/userSettings.service";
import { uploadImage } from "../services/misc/image.service";
import { IUserSettings } from "../types";

import { env } from "../utils/env";
import logger from "../config/loggingConfig";

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

    if (!authUser) {
      logger.warn("No authenticated user found for user preferences.");
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // file handling
    const file = req.file;
    const image = file ? await uploadImage(file, 'user-preferences') : '';
    const formData = req.body;

    const searchMapCenter = formData.search_map_center ? JSON.parse(formData.search_map_center) : { type: 'Point', coordinates: [0, 0] };

    // fetch existing user settings data
    const existingUserSettings = authUser.pi_uid ? await userSettingsService.getUserSettingsById(authUser.pi_uid) : null;

    // construct user settings object
    const userSettings: Partial<IUserSettings> = {
      ...existingUserSettings, // Ensures existing values are preserved; provides a fallback in case new fields are added later. 
      user_settings_id: authUser.pi_uid || existingUserSettings?.user_settings_id,
      email: formData.email || existingUserSettings?.email || '',
      phone_number: formData.phone_number || existingUserSettings?.phone_number || '',
      image: image || existingUserSettings?.image || env.CLOUDINARY_PLACEHOLDER_URL,
      search_map_center: searchMapCenter || existingUserSettings?.search_map_center || { type: 'Point', coordinates: [0, 0] }
    };

    const userPreferences = await userSettingsService.addOrUpdateUserSettings(userSettings, authUser);
    logger.info(`Added or updated User Preferences for user with ID: ${authUser.pi_uid}`);
    res.status(200).json({ settings: userPreferences });    
  } catch (error: any) {
    logger.error(`Failed to add or update User Preferences for user with ID ${req.currentUser?.pi_uid}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
