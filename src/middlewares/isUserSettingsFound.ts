import { NextFunction, Request, Response } from "express";

import UserSettings from "../models/UserSettings";
import { IUserSettings } from "../types";

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
    const currentUserSettings: IUserSettings | null = await UserSettings.findOne({user_settings_id: userSettingsId});

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
