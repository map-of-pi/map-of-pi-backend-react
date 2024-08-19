import { NextFunction, Request, Response } from "express";

import { decodeUserToken } from "../helpers/jwt";
import { IUser } from "../types";

import logger from "../config/loggingConfig";

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: IUser;
    token?: string;
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("Authentication token is missing.");
    return res.status(401).json({message: "Authentication token is required"});
  }

  try {
    const currentUser = await decodeUserToken(token);

    if (!currentUser) {
      logger.warn("Authentication token is invalid or expired.");
      return res.status(401).json({message: "Authentication token is invalid or expired"});
    }

    //@ts-ignore
    req.currentUser = currentUser;
    next();
  } catch (error: any) {
    logger.error("Failed to verify token:", error);
    return res.status(500).json({ message: error.message });
  }
};
