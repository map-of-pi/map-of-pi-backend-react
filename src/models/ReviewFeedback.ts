import mongoose, { Schema } from "mongoose";

import { IReviewFeedback } from "../types";

import { RatingScale } from "./enums/ratingScale";

const reviewFeedbackSchema = new Schema<IReviewFeedback>(
  {
    review_id: {
      type: String,
      required: true
    },
    review_receiver_id: {
      type: String,
      required: true
    },
    review_giver_id: {
      type: String,
      required: true
    },
    reply_to_review_id: {
      type: String,
      required: false,
      default: null
    },
    rating: {
      type: Number,
      enum: Object.values(RatingScale).filter(value => typeof value === 'number'),
      required: true
    },
    comment: {
      type: String,
      required: false
    },
    image: {
      type: String,
      required: false
    },
    review_date: {
      type: Date,
      required: true
    }
  },
);

const ReviewFeedback = mongoose.model<IReviewFeedback>("Review-Feedback", reviewFeedbackSchema);

export default ReviewFeedback;
