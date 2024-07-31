import { NextFunction, Request, Response } from "express";

import Seller from "../models/Seller";
import { ISeller, IUser } from "../types";

declare module 'express-serve-static-core' {
  interface Request {
    currentSeller: ISeller;
  }
}

export const isSellerFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const seller_id = req.currentUser?.pi_uid;
  console.log('seller ID', seller_id)
  try {
    const currentSeller: ISeller | null = await Seller.findOne({seller_id});

    if (currentSeller) {
      req.currentSeller = currentSeller;
      return next();
    } else {
      return res.status(404).json({
        message: "Seller not found",
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
