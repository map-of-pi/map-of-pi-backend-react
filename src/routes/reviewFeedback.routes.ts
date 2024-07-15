import { Router } from "express";

import * as reviewFeedbackController from "../controllers/reviewFeedbackController";
import { verifyToken } from "../middlewares/verifyToken";
import upload from "../utils/multer";

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewFeedbackSchema:
 *       type: object
 *       properties:
 *         review_id:
 *           type: string
 *           description: Unique ID of the review
 *         review_receiver_id:
 *           type: string
 *           description: Pi user ID of the user receiving the review
 *         review_giver_id:
 *           type: string
 *           description: Pi user ID of the user giving the review
 *         reply_to_review_id:
 *           type: string
 *           description: Unique ID of the replied review
 *         rating:
 *           $ref: '/api/docs/enum/RatingScale.yml#/components/schemas/RatingScale'
 *         comment:
 *           type: string
 *           description: Comment given in the review
 *         image:
 *           type: string
 *           description: Image associated with the review
 *         review_date:
 *           type: string
 *           format: date-time
 *           description: Date when the review was given
 *       required:
 *         - review_id
 *         - review_receiver_id
 *         - review_giver_id
 *         - reply_to_review_id
 *         - rating
 *         - review_date
 */
const reviewFeedbackRoutes = Router();

/**
 * @swagger
 * /api/v1/review-feedback/{review_receiver_id}:
 *   get:
 *     tags:
 *       - Review Feedback
 *     summary: Get all associated reviews for seller
 *     parameters:
 *       - name: review_receiver_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review receiver to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/ReviewFeedbackSchema.yml#/components/schemas/GetReviewsRs'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
reviewFeedbackRoutes.get("/:review_receiver_id", reviewFeedbackController.getReviews);

/**
 * @swagger
 * /api/v1/review-feedback/single/{review_id}:
 *   get:
 *     tags:
 *       - Review Feedback
 *     summary: Get a single review by review ID
 *     parameters:
 *       - name: review_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to retrieve
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '/api/docs/ReviewFeedbackSchema.yml#/components/schemas/GetSingleReviewRs'
 *       404:
 *         description: Review not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
reviewFeedbackRoutes.get("/single/:review_id", reviewFeedbackController.getSingleReviewById);

/**
 * @swagger
 * /api/v1/review-feedback/add:
 *   post:
 *     tags:
 *       - Review Feedback
 *     summary: Add a new review *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '/api/docs/ReviewFeedbackSchema.yml#/components/schemas/AddReviewRq'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/api/docs/ReviewFeedbackSchema.yml#/components/schemas/AddReviewRs'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
reviewFeedbackRoutes.post(
  "/add",
  verifyToken,
  upload.array("images"),
  reviewFeedbackController.addReview
);

export default reviewFeedbackRoutes;
