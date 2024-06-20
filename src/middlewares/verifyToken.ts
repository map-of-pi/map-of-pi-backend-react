import { NextFunction, Request, Response } from "express";

import * as jwtHelper from "../helpers/jwt";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Map of Pi requires authentication tokens to be included in request headers.",
    });
  }

  try {
    const currentUser = await jwtHelper.decodeUserToken(token);

    if (!currentUser) {
      return res.status(401).json({
        message:
          "Map of Pi indicates that the provided token is either invalid or does not correspond to a user in the system.",
      });
    }

    //@ts-ignore
    req.currentUser = currentUser

    next();
  } catch (error: any) {
    return res
      .status(401)
      .json({ error: "Unauthorized - Invalid token", message: error.message });
  }
};
