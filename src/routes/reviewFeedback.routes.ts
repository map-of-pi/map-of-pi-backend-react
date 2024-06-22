import { Router } from "express";

import * as reviewFeedbackController from "../controllers/reviewFeedbackController";
import { verifyToken } from "../middlewares/verifyToken";
import upload from "../utils/multer";

const reviewFeedbackRoutes = Router();

reviewFeedbackRoutes.get("/:review_receiver_id", reviewFeedbackController.getReviews);

reviewFeedbackRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  reviewFeedbackController.addReview
);

reviewFeedbackRoutes.get("/single/:review_id", reviewFeedbackController.getSingleReviewById);

export default reviewFeedbackRoutes;
