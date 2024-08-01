import { NextFunction, Request, Response } from "express";
import { IUserSettings } from "../types";

declare module 'express-serve-static-core' {
  interface Request {
    currentUserSettings: IUserSettings;
  }
}

export const isUserSettingsOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    
    try {
      //@ts-ignore
      const currentUserId = req.currentUser?.pi_uid;
      const userSettingsId = req.currentUserSettings.user_settings_id;
  
      if (userSettingsId === currentUserId) {
        return next();
      } else {
        return res.status(401).json({
          message: "You do not have the authorization to manage because you are not the user",
        });
      }
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  };