import { Request, Response } from "express";

import * as reviewFeedbackService from "../services/reviewFeedback.service";
import { uploadImage } from "../services/misc/image.service";
import { IReviewFeedback } from "../types";

import { env } from "../utils/env";
import logger from "../config/loggingConfig";

export const getReviews = async (req: Request, res: Response) => {
  const { review_receiver_id } = req.params;
  try {
    const currentReviews: IReviewFeedback[] | null = await reviewFeedbackService.getReviewFeedback(review_receiver_id);
    logger.info(`Retrieved reviews for receiver ID ${review_receiver_id}`);
    return res.status(200).json(currentReviews);
  } catch (error: any) {
    logger.error(`Failed to get reviews for receiver ID ${review_receiver_id}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getSingleReviewById = async (req: Request, res: Response) => {
  const { review_id } = req.params;
  try {
    const associatedReview: IReviewFeedback | null = await reviewFeedbackService.getReviewFeedbackById(review_id);
    if (!associatedReview) {
      logger.warn(`Review with ID ${review_id} not found.`);
      return res.status(404).json({ message: "Review not found" });
    }
    logger.info(`Retrieved review with ID ${review_id}`);
    res.status(200).json(associatedReview);
  } catch (error: any) {
    logger.error(`Failed to get review with ID ${review_id}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req: Request, res: Response) => {
  try {
    const reviewData = req.body;
    const authUser = req.currentUser;

    if (!authUser) {
      logger.warn("No authenticated user found for adding review.");
      return res.status(401).json({ message: "Unauthorized user" });
    } else if (authUser.pi_uid === reviewData.review_receiver_id) {
      logger.warn(`Attempted self review by user ${authUser.pi_uid}`);
      return res.status(400).json({ message: "Self review is prohibited" });
    }

    // file handling
    const file = req.file;
    const image = file ? await uploadImage(file, 'review-feedback') : '';
    const formData = req.body;

    // fetch existing review feedback data
    const existingReviewFeedback = authUser.pi_uid ? await reviewFeedbackService.getReviewFeedbackById(formData.review_id) : null;

    // construct review feedback object
    const reviewFeedback: Partial<IReviewFeedback> = {
      _id: formData.review_id || existingReviewFeedback?._id,
      review_receiver_id: formData.review_receiver_id || '',
      review_giver_id: formData.review_giver_id || authUser.pi_uid,
      reply_to_review_id: formData.reply_to_review_id || '',
      rating: formData.rating || '',
      comment: formData.comment || '',
      image: image || env.CLOUDINARY_PLACEHOLDER_URL,
      review_date: formData.review_date || ''
    };

    const newReview = await reviewFeedbackService.addReviewFeedback(reviewFeedback, authUser);
    logger.info(`Added new review by user ${authUser.pi_uid} for receiver ID ${reviewFeedback.review_receiver_id}`);
    return res.status(200).json({ newReview });
  } catch (error: any) {
    logger.error(`Failed to add review: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
