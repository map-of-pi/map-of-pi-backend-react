import { Request, Response } from "express";

import * as userSettingsService from '../services/userSettings.service';
import { IUserSettings } from '../types';

export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    const { user_settings_id } = req.params;
    const userPreferences: IUserSettings | null = await userSettingsService.getUserSettingsById(user_settings_id);
    if (!userPreferences) {
      return res.status(404).json({ message: "User Preferences not found." });
    }
    res.status(200).json(userPreferences);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchUserPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser || !req.currentUserSettings) {
      return res.status(404).json({ message: "User Preferences not found." });
    }
    const currentUserPreferences = req.currentUserSettings;
    res.status(200).json(currentUserPreferences);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserPreferences = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser
    if (authUser) {
      const userSettingsData = req.body;
      const userPreferences = await userSettingsService.addOrUpdateUserSettings(userSettingsData, authUser);
      res.status(200).json({ settings: userPreferences });
    }    
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
