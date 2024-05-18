import mongoose, { Schema, Types } from "mongoose";
import { IReview } from "../types";

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    message: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviewer: { type: Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
