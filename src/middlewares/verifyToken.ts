import { NextFunction, Request, Response } from "express";

import { decodeUserToken } from "../helpers/jwt";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  try {
    const currentUser = await decodeUserToken(token);

    if (!currentUser) {
      return res.status(401).json({
        message: "Authentication token is invalid or expired",
      });
    }

    //@ts-ignore
    req.currentUser = currentUser;
    next();
  } catch (error: any) {
    return res
      .status(401)
      .json({ error: "Unauthorized due to invalid token", message: error.message });
  }
};
