import { Router } from "express";
import * as reviewController from "../controllers/reviewFeedbackController";
import upload from "../utils/multer";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isReviewOwner } from "../middlewares/isReviewOwner";
// import { isShopFound } from "../middlewares/isShopFound";

const reviewRoutes = Router();

reviewRoutes.get("/:user_id", reviewController.getSingleUserReview); //get all reviews associated to a user

reviewRoutes.post(
  "/add",
  isAuthenticated,
  upload.array("images"),
  reviewController.addReviewToShop
);

reviewRoutes.get("/:id", reviewController.getAssociatedReviews);

reviewRoutes.put(
  "/:id",
  isAuthenticated,
  isReviewOwner,
  reviewController.updateReview
);

reviewRoutes.delete(
  "/:id",
  isAuthenticated,
  isReviewOwner,
  reviewController.deleteReview
);

export default reviewRoutes;
