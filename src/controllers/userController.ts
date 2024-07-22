import { Request, Response } from "express";

import * as jwtHelper from "../helpers/jwt";
import * as userService from "../services/user.service";

export const authenticateUser = async (req: Request, res: Response) => {
  const {authResult} = req.body;
  const auth = authResult.user

  try {
    const user = await userService.authenticate(auth);
    const token = jwtHelper.generateUserToken(user);
    const expiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    return res.cookie("token", token, {httpOnly: true, expires: expiresDate, secure: true, priority: "high", sameSite: "lax"}).status(200).json({
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
