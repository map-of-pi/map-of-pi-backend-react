import { NextFunction, Request, Response } from "express";
import Shop from "../models/Shop";
import { IShop } from "../types";

export const isShopFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const currentShop: IShop | null = await Shop.findById(id);

    if (currentShop) {
      (req as any).currentShop = currentShop;
      return next();
    } else {
      return res.status(404).json({
        message: "Shop not found",
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
