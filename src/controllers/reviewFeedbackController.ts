// controllers/reviewFeedbackController.ts
import { Request, Response } from 'express';
import ReviewFeedback from '../models/ReviewFeedback';
import { IReviewFeedback } from '../types';

// Add a new review to a shop
export const addReviewToShop = async (req: Request, res: Response) => {
  try {
    const { review_id, review_receiver_id, review_giver_id, reply_to_review_id, rating, comment } = req.body;
    // type assertion to treat req.files as an array of Express.Multer.File
    const files = req.files as Express.Multer.File[];
    const image = files?.[0]?.path || '';

    const newReview: IReviewFeedback = new ReviewFeedback({
      review_id,
      review_receiver_id,
      review_giver_id,
      reply_to_review_id,
      rating,
      comment,
      image,
      review_date: new Date()
    });

    await newReview.save();
    return res.status(201).json(newReview);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};

// Get all reviews associated with a user
export const getSingleUserReview = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const reviews = await ReviewFeedback.find({ review_receiver_id: user_id });

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this user' });
    }

    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
};

// Get all associated reviews by review ID
export const getAssociatedReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviews = await ReviewFeedback.find({ review_id: id });

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No associated reviews found' });
    }

    return res.status(200).json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching associated reviews', error: error.message });
  }
};

// Update a review
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    // type assertion to treat req.files as an array of Express.Multer.File
    const files = req.files as Express.Multer.File[];
    const image = files?.[0]?.path || (req as any).currentReview.image;

    const updatedReview = await ReviewFeedback.findByIdAndUpdate(
      id,
      { rating, comment, image },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json(updatedReview);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedReview = await ReviewFeedback.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
