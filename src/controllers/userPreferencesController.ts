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

export const addUserPreferences = async (req: Request, res: Response) => {
  try {
    const userSettingsData = req.body;
    const newUserPreferences = await userSettingsService.addUserSettings(userSettingsData);
    res.status(200).json({ newUserPreferences: newUserPreferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  try {
    const { user_settings_id } = req.params;
    const userSettingsData = req.body;
    const updatedUserPreferences = await userSettingsService.updateUserSettings(user_settings_id, userSettingsData);
    return res.status(200).json({ updatedUserPreferences: updatedUserPreferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
