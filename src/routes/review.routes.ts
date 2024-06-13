import { Router } from "express";

import * as reviewController from "../controllers/reviewFeedbackController";
import { verifyToken } from "../middlewares/verifyToken";
import { isReviewOwner } from "../middlewares/isReviewOwner";
import upload from "../utils/multer";

const reviewRoutes = Router();

reviewRoutes.get("/:user_id", reviewController.getSingleUserReview);

reviewRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  reviewController.addReviewToShop
);

reviewRoutes.get("/:id", reviewController.getAssociatedReviews);

reviewRoutes.put(
  "/:id",
  verifyToken,
  isReviewOwner,
  reviewController.updateReview
);

reviewRoutes.delete(
  "/:id",
  verifyToken,
  isReviewOwner,
  reviewController.deleteReview
);

export default reviewRoutes;
