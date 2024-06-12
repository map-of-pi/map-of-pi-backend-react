import { NextFunction, Request, Response } from "express";
import { IReviewFeedback  } from "../types";
import ReviewFeedback from "../models/ReviewFeedback";

export const isReviewOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;
    try {
      const currentReview: IReviewFeedback | null = await ReviewFeedback.findById(id);
  
      if (currentReview) {
        (req as any).currentReview = currentReview;
        return next();
      } else {
        return res.status(404).json({
          message: "Review not found",
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
  