import { NextFunction, Request, Response } from "express";
import Toggle from "../models/misc/Toggle";
import logger from '../config/loggingConfig';

export const isToggle = (toggleName: string) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const toggle = await Toggle.findOne({ name: toggleName });

    if (!toggle || !toggle.enabled) {
      return res.status(403).json({
        message: "Feature is currently disabled",
      });
    }

    return next();
  } catch (error) {
    logger.error(`Failed to fetch toggle ${toggleName}:`, error);
    return res.status(500).json({ 
      message: 'Failed to determine feature state; please try again later' 
    });
  }
};
