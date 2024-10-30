import { NextFunction, Request, Response } from "express";

import Seller from "../models/Seller";
import { ISeller } from "../types";

import logger from '../config/loggingConfig';

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

  try {
    logger.info(`Checking if seller exists for user ID: ${seller_id}`);
    const currentSeller: ISeller | null = await Seller.findOne({seller_id});

    if (currentSeller) {
      req.currentSeller = currentSeller;
      logger.info(`Seller found: ${currentSeller._id}`);
      return next();
    } else {
      logger.warn(`Seller not found for user ID: ${seller_id}`);
      return res.status(404).json({message: "Seller not found"});
    }
  } catch (error) {
    logger.error('Failed to identify seller:', error);
    res.status(500).json({ message: 'Failed to identify | seller not found; please try again later'});
  }
};
