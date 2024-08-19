import { IReviewFeedback, IUser } from "../types";
import { getUser } from "./user.service";
import ReviewFeedback from "../models/ReviewFeedback";
import Seller from "../models/Seller";

import logger from "../config/loggingConfig";

/**
  The value is set depending on the number of zero(0) ratings in the ReviewFeedback table where this user is review-receiver. 
  IF user has less than 2% zero ratings THEN set it to 100. 
  IF user has 2%-5% zero ratings THEN set it to 80. 
  IF user has 5%-10% zero ratings THEN set it to 50. 
  IF user has more than 10% zero ratings THEN set it to 0.
  When the Seller Registration screen is first used (before the users Seller record has been created) 
  then the value of “100” is displayed and saved to the DB.
**/
const computeRatings = async (seller_id: string) => {
  try {
    // Fetch all reviews for the seller
    const reviewFeedbackList = await ReviewFeedback.find({ review_receiver_id: seller_id }).exec();
    if (reviewFeedbackList.length === 0) {
      // Default value when there are no reviews
      await Seller.findOneAndUpdate({ seller_id }, { trust_meter_rating: 100 });
      return 100;
    }

    // Calculate the total number of reviews and the number of zero ratings
    const totalReviews = reviewFeedbackList.length;
    const zeroRatingsCount = reviewFeedbackList.filter(review => review.rating === 0).length;

    // Calculate the percentage of zero ratings
    const zeroRatingsPercentage = (zeroRatingsCount / totalReviews) * 100;

    // Determine the value based on the percentage of zero ratings
    let value;
    switch (true) {
      case (zeroRatingsPercentage < 2):
        value = 100;
        break;
      case (zeroRatingsPercentage >= 2 && zeroRatingsPercentage < 5):
        value = 80;
        break;
      case (zeroRatingsPercentage >= 5 && zeroRatingsPercentage < 10):
        value = 50;
        break;
      default:
        value = 0;
    }

    // Update the seller's rating value in the database
    await Seller.findOneAndUpdate({ seller_id }, { trust_meter_rating: value });
    return value;
  } catch (error: any) {
    logger.error(`Error computing ratings for sellerID ${seller_id}: ${error.message}`);
    throw new Error(`Error computing ratings for sellerID ${seller_id}`);
  }
};

export const getReviewFeedback = async (review_receiver_id: string): Promise<IReviewFeedback[]> => {
  try {
    const reviewFeedbackList = await ReviewFeedback.find({ review_receiver_id }).exec();

    // Update each reviewFeedback item with the reviewer's username instead of ID
    const updatedReviewFeedbackList = await Promise.all(
      reviewFeedbackList.map(async (reviewFeedback) => {
        const reviewer = await getUser(reviewFeedback.review_giver_id);
        const username = reviewer ? reviewer.user_name : '';
        return { ...reviewFeedback.toObject(), review_giver_id: username };
      })
    );

    return updatedReviewFeedbackList as IReviewFeedback[] ;
  } catch (error: any) {
    logger.error(`Error retrieving review feedback collection for userID ${review_receiver_id}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const getReviewFeedbackById = async (review_id: string): Promise<IReviewFeedback | null> => {
  try {
    const reviewFeedback = await ReviewFeedback.findById({ _id: review_id }).exec();

    if (!reviewFeedback) {
      return null;
    }
    const reviewer = await getUser(reviewFeedback.review_giver_id);
    reviewFeedback.review_giver_id = reviewer ? reviewer.user_name : '';
    return reviewFeedback as IReviewFeedback;
  } catch (error: any) {
    logger.error(`Error retrieving review feedback with reviewID ${review_id}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const addReviewFeedback = async (reviewFeedbackData: IReviewFeedback, authUser: IUser): Promise<IReviewFeedback> => {
  const { review_receiver_id, reply_to_review_id } = reviewFeedbackData;
  const date = new Date();

  const newReviewFeedback = new ReviewFeedback({
    ...reviewFeedbackData,
    review_date: date,
    review_giver_id: authUser.pi_uid,
    reply_to_review_id: reply_to_review_id || null,
  });

  try {
    const savedReviewFeedback = await newReviewFeedback.save();

    computeRatings(review_receiver_id)
      .then(value => logger.info(`Computed review rating: ${value}`))
      .catch(error => logger.error(`Error computing review rating: ${error.message}`));

    return savedReviewFeedback;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';
    logger.error(`Error adding new review feedback: ${errorMessage}`);
    throw new Error(errorMessage);
  }
};
