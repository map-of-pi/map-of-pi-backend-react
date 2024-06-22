import { Request, Response } from 'express';

import * as reviewFeedbackService from "../services/reviewFeedback.service";
import { IReviewFeedback } from '../types';

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { review_receiver_id } = req.params;
    const currentReviews: IReviewFeedback[] | null = await reviewFeedbackService.getReviewFeedback(review_receiver_id);
    return res.status(200).json(currentReviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleReviewById = async (req: Request, res: Response) => {
  try {
    const { review_id } = req.params;
    const associatedReview: IReviewFeedback | null = await reviewFeedbackService.getReviewFeedbackById(review_id);
    if (!associatedReview) {
      return res.status(404).json({ message: "Review not found." });
    }
    res.status(200).json(associatedReview);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req: Request, res: Response) => {
  try {
    const reviewData = req.body;
    const newReview = await reviewFeedbackService.addReviewFeedback(reviewData);
    return res.status(200).json({ newReview });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
