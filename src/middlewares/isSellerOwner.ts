import { NextFunction, Request, Response } from "express";

export const isSellerOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { seller_id } = req.params;
  
  try {
    //@ts-ignore
    const currentUser = req.currentUser;

    if (seller_id === currentUser.uid) {
      return next();
    } else {
      return res.status(401).json({
        message: "You do not have the authorization to manage because you are not the seller",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};
