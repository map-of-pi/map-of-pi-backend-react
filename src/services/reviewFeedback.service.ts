import ReviewFeedback from "../models/ReviewFeedback";
import { IReviewFeedback } from "../types";

export const getReviewFeedback = async (review_receiver_id: string): Promise<IReviewFeedback[]> => {
  try {
    const reviewFeedback = await ReviewFeedback.find({review_receiver_id});
    return reviewFeedback;
  } catch (error: any) {
    console.error(`Error retrieving review feedback collection for userID ${review_receiver_id}: `, error.message);
    throw new Error(error.message);
  }
};

export const getReviewFeedbackById = async (review_id: string): Promise<IReviewFeedback | null> => {
  try {
    const reviewFeedback = await ReviewFeedback.findOne({review_id});
    return reviewFeedback;
  } catch (error: any) {
    console.error(`Error retrieving review feedback with reviewID ${review_id}:`, error.message);
    throw new Error(error.message);
  }
};

export const addReviewFeedback = async (reviewFeedbackData: IReviewFeedback): Promise<IReviewFeedback> => {
  try {
    const newReviewFeedback = new ReviewFeedback(reviewFeedbackData);
    const savedReviewFeedback = await newReviewFeedback.save();
    return savedReviewFeedback;
  } catch (error: any) {
    console.error("Error adding new review feedback: ", error.message);
    throw new Error(error.message);
  }
};
