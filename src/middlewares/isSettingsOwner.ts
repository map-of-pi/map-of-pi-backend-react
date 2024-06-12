import { NextFunction, Request, Response } from "express";
import { IUserSettings } from "../types";
import UserSettings from "../models/UserSettings";

export const isSettingsOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;
    try {
      const currentReview: IUserSettings | null = await UserSettings.findById(id);
  
      if (currentReview) {
        (req as any).currentReview = currentReview;
        return next();
      } else {
        return res.status(404).json({
          message: "Review not found",
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };