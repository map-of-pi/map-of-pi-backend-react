import { NextFunction, Request, Response } from "express";

export const isUserSettingsOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { user_settings_id } = req.params;

    try {
      //@ts-ignore
      const currentUser = req.currentUser;
  
      if (user_settings_id === currentUser.uid) {
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