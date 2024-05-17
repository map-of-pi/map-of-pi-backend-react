import { NextFunction, Request, Response } from "express";
import * as jwtHelper from "../helpers/jwt";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Map of pi say every request must have token in headers",
    });
  }

  try {
    const currentUser = await jwtHelper.decodeUserToken(token);

    if (!currentUser) {
      return res.status(401).json({
        message:
          "Map of pi say Token provided is invalid or could not found user associated to it",
      });
    }

    //@ts-ignore
    req.currentUser = currentUser;

    next();
  } catch (error: any) {
    return res
      .status(401)
      .json({ error: "Unauthorized - Invalid token", message: error.message });
  }
};
