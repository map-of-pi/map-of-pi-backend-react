import { Request, Response } from "express";
import * as userService from "../services/user.service";
import * as jwtHelper from "../helpers/jwt";

export const authenticateUser = async (req: Request, res: Response) => {
  const auth = req.body.AuthResult;
  try {
    const { user: currentUser, userExist } = await userService.authenticate(
      auth
    );
    const token = jwtHelper.generateUserToken(currentUser);

    if (userExist) {
      return res.status(200).json({
        currentUser,
        token,
      });
    } else {
      return res.status(201).json({
        currentUser,
        token,
      });
    }
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
