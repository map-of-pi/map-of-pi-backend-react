import ReviewFeedback from "../models/ReviewFeedback";
import { IReviewFeedback } from "../types";
import { getUser } from "./user.service";

export const getReviewFeedback = async (review_receiver_id: string): Promise<IReviewFeedback[]> => {
  try {
    const reviewFeedbackList = await ReviewFeedback.find({ review_receiver_id }).exec();

    // Update each reviewFeedback item with the reviewer's username instead of ID
    const updatedReviewFeedbackList = await Promise.all(
      reviewFeedbackList.map(async (reviewFeedback) => {
        const reviewer = await getUser(reviewFeedback.review_giver_id);
        const username = reviewer ? reviewer.pi_alias : '';
        return { ...reviewFeedback.toObject(), review_giver_id: username };
      })
    );

    return updatedReviewFeedbackList as IReviewFeedback[] ;
  } catch (error: any) {
    console.error(`Error retrieving review feedback collection for userID ${review_receiver_id}: `, error.message);
    throw new Error(error.message);
  }
};

export const getReviewFeedbackById = async (review_id: string): Promise<IReviewFeedback | null> => {
  try {
    const reviewFeedback = await ReviewFeedback.findOne({ review_id }).exec();

    if (!reviewFeedback) {
      return null;
    }

    // Update reviewFeedback with reviewer's username instead of ID
    const reviewer = await getUser(reviewFeedback.review_giver_id);
    reviewFeedback.review_giver_id = reviewer ? reviewer.pi_alias : '';

    return reviewFeedback as IReviewFeedback; // Return the modified review feedback object
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
