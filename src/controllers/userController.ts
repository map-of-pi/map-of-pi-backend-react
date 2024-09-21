import { Request, Response } from "express";

import * as jwtHelper from "../helpers/jwt";
import * as userService from "../services/user.service";
import { IUser } from "../types";

import logger from '../config/loggingConfig';

export const authenticateUser = async (req: Request, res: Response) => {
  const auth = req.body;

  try {
    const user = await userService.authenticate(auth.user);
    const token = jwtHelper.generateUserToken(user);
    const expiresDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

    logger.info(`User authenticated: ${user.pi_uid}`);

    return res.cookie("token", token, {httpOnly: true, expires: expiresDate, secure: true, priority: "high", sameSite: "lax"}).status(200).json({
      user,
      token,
    });
  } catch (error: any) {
    logger.error(`Failed to authenticate user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const autoLoginUser = async(req: Request, res: Response) => {
  //@ts-ignore
  const currentUser = req.currentUser;
  try {
    logger.info(`Auto-login successful for user: ${currentUser?.pi_uid || "NULL"}`);
    res.status(200).json(currentUser);
  } catch (error: any) {
    logger.error(`Failed to auto-login user: ${error.message}`);
    res.status(500).json({message: error.message});
  }
};

export const getUser = async(req: Request, res: Response) => {
  const { pi_uid } = req.params;
  try {
    const currentUser: IUser | null = await userService.getUser(pi_uid);
    if (!currentUser) {
      logger.warn(`User not found with PI_UID: ${pi_uid}`);
      return res.status(404).json({ message: "User not found" });
    }
    logger.info(`Fetched user with PI_UID: ${pi_uid}`);
    res.status(200).json(currentUser);
  } catch (error: any) {
    logger.error(`Failed to fetch user with PI_UID ${pi_uid}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { pi_uid } = req.params;
  try {
    const deletedData = await userService.deleteUser(pi_uid);
    logger.info(`Deleted user with PI_UID: ${pi_uid}`);
    res.status(200).json({ message: "User deleted successfully", deletedData });
  } catch (error: any) {
    logger.error(`Failed to delete user with PI_UID ${pi_uid}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
