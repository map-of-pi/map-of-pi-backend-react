import { NextFunction, Request, Response } from "express";
import { IShop, IUser } from "../types";
import Shop from "../models/Shop";

export const isShopOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser: IUser = (req as any).currentUser;
  const currentShop: IShop = (req as any).currentShop;
  try {
    if (currentShop?.owner?._id === currentUser._id) {
      return next();
    } else {
      return res.status(403).json({
        message: "You can't update this shop since it doesn't belong to u",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
