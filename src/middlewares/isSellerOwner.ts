import { NextFunction, Request, Response } from "express";

import { decodeUserToken } from "../helpers/jwt";

export const isSellerOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { seller_id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized with missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const currentUser = await decodeUserToken(token);
    if (seller_id === currentUser.uid) {
      return next();
    } else {
      return res.status(403).json({
        message: "You do not have the authorization to manage because you are not the seller.",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
