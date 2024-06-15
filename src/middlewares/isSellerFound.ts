import { NextFunction, Request, Response } from "express";

import Seller from "../models/Seller";
import { ISeller } from "../types";

export const isSellerFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { seller_id } = req.params;
  try {
    const currentSeller: ISeller | null = await Seller.findOne({seller_id});

    if (currentSeller) {
      (req as any).currentSeller = currentSeller;
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
