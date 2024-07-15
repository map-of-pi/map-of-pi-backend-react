import { NextFunction, Request, Response } from "express";

import UserSettings from "../models/UserSettings";
import { IUserSettings } from "../types";

export const isUserSettingsFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_settings_id } = req.params;
  try {
    const currentUserSettings: IUserSettings | null = await UserSettings.findOne({user_settings_id});

    if (currentUserSettings) {
      (req as any).currentUserSettings = currentUserSettings;
      return next();
    } else {
      return res.status(404).json({
        message: "User Settings not found",
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
