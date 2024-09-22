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
  // First, checking if the token exists in the cookies
  const tokenFromCookie = req.cookies.token;

  // Fallback to the authorization header if token is not in the cookie
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.split(" ")[1];

  // Prioritize token from cookies, then from header
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    logger.warn("Authentication token is missing.");
    return res.status(401).json({ message: "Authentication token is required" });
  }

  try {
    // Decode the token to get the user information
    const currentUser = await decodeUserToken(token);

    if (!currentUser) {
      logger.warn("Authentication token is invalid or expired.");
      return res.status(401).json({ message: "Authentication token is invalid or expired" });
    }

    // Attach currentUser to the request object
    req.currentUser = currentUser;
    req.token = token;
    next();
  } catch (error: any) {
    logger.error("Failed to verify token:", error);
    return res.status(500).json({ message: error.message });
  }
};
