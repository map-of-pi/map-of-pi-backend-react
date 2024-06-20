import { Request, Response } from "express";

import * as jwtHelper from "../helpers/jwt";
import * as userService from "../services/user.service";

export const authenticateUser = async (req: Request, res: Response) => {
  const auth = req.body;

  try {
    const user = await userService.authenticate(auth.auth.user);
    const token = jwtHelper.generateUserToken(user);

    return res.status(200).json({
      user,
      token,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const signoutUser = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const autoLoginUser = async(req: Request, res: Response) => {
  //@ts-ignore
  const currentUser = req.currentUser;
  try{
    res.status(200).json(currentUser)
  } catch (error: any) {
    res.status(500).json({message: error.message});
  }
}