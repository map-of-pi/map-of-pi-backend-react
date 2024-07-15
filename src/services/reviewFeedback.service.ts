import ReviewFeedback from "../models/ReviewFeedback";
import { IReviewFeedback } from "../types";

export const getReviewFeedback = async (review_receiver_id: string): Promise<IReviewFeedback[]> => {
  try {
    const reviewFeedback = await ReviewFeedback.find({review_receiver_id}).exec();
    return reviewFeedback;
  } catch (error: any) {
    console.error(`Error retrieving review feedback collection for userID ${review_receiver_id}: `, error.message);
    throw new Error(error.message);
  }
};

export const getReviewFeedbackById = async (review_id: string): Promise<IReviewFeedback | null> => {
  try {
    const reviewFeedback = await ReviewFeedback.findOne({review_id}).exec();
    return reviewFeedback;
  } catch (error: any) {
    console.error(`Error retrieving review feedback with reviewID ${review_id}:`, error.message);
    throw new Error(error.message);
  }
};

export const addReviewFeedback = async (reviewFeedbackData: IReviewFeedback): Promise<IReviewFeedback> => {
  const { review_receiver_id, review_giver_id, reply_to_review_id } = reviewFeedbackData;
  const date = new Date();

  const newReviewFeedback = new ReviewFeedback({
    ...reviewFeedbackData,
    review_date: date,
    review_id: `${review_receiver_id}_${review_giver_id}_${date}`,
    reply_to_review_id: reply_to_review_id || null,
  });

  try {
    const savedReviewFeedback = await newReviewFeedback.save();
    return savedReviewFeedback;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';
    console.error("Error adding new review feedback: ", errorMessage);
    throw new Error(errorMessage);
  }
};
