import { NextFunction, Request, Response } from "express";
import { platformAPIClient } from "../config/platformAPIclient";
import { IUser } from "../types";
import User from "../models/User";

export const isPioneerFound = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const auth = req.body.pioneerAuth;

    try {
      // Verify the user's access token with the /me endpoint:
      const me = await platformAPIClient.get(`/v2/me`, { headers: { 'Authorization': `Bearer ${auth.accessToken}` } });
      console.log('Pioneer data obtained from Pioneer authentication', me.data);
      
      if(!me){
        return res.status(401).json({
            message: "Pioneer user not authorized",
          });
      }

      const user = {
        pi_uid: me.data.uid,
        pi_username: me.data.username,
        user_name: me.data.username
      }

      req.body.user = user;
      return next();

    } catch (err) {
      console.log(err);
      return res.status(401).json({error: "Invalid access token"}) 
    }
    
  };
  