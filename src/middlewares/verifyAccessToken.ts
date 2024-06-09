import { NextFunction, Request, Response } from "express";
import { platformAPIClient } from "../config/platformAPIclient";

export const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authResult } = req.body;

  console.log(authResult);
  try {
    const me = await platformAPIClient.get("/v2/me", {
      headers: { Authorization: `Bearer ${authResult!.accessToken}` },
    });
    console.log("User details from /me endpoint:", me.data);
    return next();
  } catch (error: any) {
    return res.status(401).json({
      message: "Invalid access token",
      success: false,
      error: error.message,
    });
  }
};
