import { getUser } from "./user.service";
import ReviewFeedback from "../models/ReviewFeedback";
import UserSettings from "../models/UserSettings";
import { IReviewFeedback, IUser, IReviewFeedbackOutput } from "../types";

import logger from "../config/loggingConfig";

/**
  The value is set depending on the number of zero(0) ratings in the ReviewFeedback table where this user is review-receiver. 
  IF user has less than 2% zero ratings THEN set it to 100. 
  IF user has 2%-5% zero ratings THEN set it to 80. 
  IF user has 5%-10% zero ratings THEN set it to 50. 
  IF user has more than 10% zero ratings THEN set it to 0.
  When the User Registration screen is first used (before the users User record has been created) 
  then the value of “100” is displayed and saved to the DB.
**/
const computeRatings = async (user_settings_id: string) => {
  try {
    // Fetch all reviews for the user
    const reviewFeedbackList = await ReviewFeedback.find({ review_receiver_id: user_settings_id }).exec();
    if (reviewFeedbackList.length === 0) {
      // Default value when there are no reviews
      await UserSettings.findOneAndUpdate({ user_settings_id }, { trust_meter_rating: 100 });
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

    // Update the user's rating value in the database
    await UserSettings.findOneAndUpdate({ user_settings_id }, { trust_meter_rating: value });
    return value;
  } catch (error: any) {
    logger.error(`Failed to compute ratings for userSettingsID ${ user_settings_id }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to compute ratings; please try again later');
  }
};

export const getReviewFeedback = async (review_receiver_id: string): Promise<IReviewFeedbackOutput[]> => {
  try {
    const reviewFeedbackList = await ReviewFeedback.find({
      $or: [
        { review_receiver_id: review_receiver_id },
        { review_giver_id: review_receiver_id }
      ]
    }).exec();

    // Update each reviewFeedback item with the reviewer's and receiver's username
    const updatedReviewFeedbackList = await Promise.all(
      reviewFeedbackList.map(async (reviewFeedback) => {
        // Retrieve user details for both giver and receiver
        const reviewer = await getUser(reviewFeedback.review_giver_id);
        const receiver = await getUser(reviewFeedback.review_receiver_id);

        const giverName = reviewer ? reviewer.user_name : '';
        const receiverName = receiver ? receiver.user_name : '';

        // Return the updated review feedback object
        return { ...reviewFeedback.toObject(), giver: giverName, receiver: receiverName };
      })
    );

    return updatedReviewFeedbackList as IReviewFeedbackOutput[];
  } catch (error: any) {
    logger.error(`Failed to retrieve reviews for reviewReceiverID ${ review_receiver_id }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to retrieve reviews; please try again later');
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
    logger.error(`Failed to retrieve review for reviewID ${ review_id }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to retrieve review; please try again later');
  }
};

export const addReviewFeedback = async (authUser: IUser, formData: any, image: string): Promise<IReviewFeedback> => {
  try {
    const reviewFeedbackData: Partial<IReviewFeedback> = {
      review_receiver_id: formData.review_receiver_id || '',
      review_giver_id: authUser.pi_uid,
      reply_to_review_id: formData.reply_to_review_id || null,
      rating: formData.rating || '',
      comment: formData.comment || '',
      image: image || '',
      review_date: new Date()
    };
    const newReviewFeedback = new ReviewFeedback(reviewFeedbackData);
    const savedReviewFeedback = await newReviewFeedback.save();

    computeRatings(savedReviewFeedback.review_receiver_id)
      .then(value => logger.info(`Computed review rating: ${value}`))
      .catch(error => logger.error(`Error computing review rating: ${error.message}`));

    return savedReviewFeedback as IReviewFeedback;
  } catch (error: any) {
    logger.error('Failed to add review:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to add review; please try again later');
  }
};