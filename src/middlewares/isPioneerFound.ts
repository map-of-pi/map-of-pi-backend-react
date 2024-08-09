import { NextFunction, Request, Response } from "express";

import { platformAPIClient } from "../config/platformAPIclient";

export const isPioneerFound = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const auth = req.body.pioneerAuth;

    try {
      // Verify the user's access token with the /me endpoint:
      const me = await platformAPIClient.get(`/v2/me`, { headers: { 'Authorization': `Bearer ${auth.accessToken}` } });
      
      if (me) {
        const user = {
          pi_uid: me.data.uid,
          pi_username: me.data.username,
          user_name: me.data.username
        }
        req.body.user = user;
        return next();
      } else {
        return res.status(404).json({
          message: "Pioneer not found",
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  