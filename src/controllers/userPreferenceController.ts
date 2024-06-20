import { Request, Response } from "express";

import * as userSettingsService from '../services/userSettings.service';
import { IUserSettings } from '../types';

export const getUserPreference = async (req: Request, res: Response) => {
  try {
    const { user_settings_id } = req.params;
    const userPreference: IUserSettings | null = await userSettingsService.getUserSettingsById(user_settings_id);
    if (!userPreference) {
      return res.status(404).json({ message: "User Preference not found." });
    }
    res.status(200).json(userPreference);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserPreference = async (req: Request, res: Response) => {
  try {
    const userSettingsData = req.body;
    const newUserPreference = await userSettingsService.addUserSettings(userSettingsData);
    res.status(201).json({ newUserPreference });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserPreference = async (req: Request, res: Response) => {
  try {
    const { user_settings_id } = req.params;
    const userSettingsData = req.body;
    const updatedUserPreference = await userSettingsService.updateUserSettings(user_settings_id, userSettingsData);
    return res.status(200).json({ updatedUserPreference });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
