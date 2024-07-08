import { Router } from "express";

import * as reviewFeedbackController from "../controllers/reviewFeedbackController";
import { verifyToken } from "../middlewares/verifyToken";
import upload from "../utils/multer";

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
 *                 $ref: '#/components/schemas/GetReviewsRs'
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
reviewFeedbackRoutes.get("/:review_receiver_id", reviewFeedbackController.getReviews);

/**
 * @swagger
 * /api/v1/review-feedback/add:
 *   post:
 *     tags:
 *       - Review Feedback
 *     summary: Add a new review
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReviewRq'
 *     responses:
 *       200:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddReviewRs'
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
 *                 $ref: '#/components/schemas/GetSingleReviewRs'
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
reviewFeedbackRoutes.get("/single/:review_id", reviewFeedbackController.getSingleReviewById);

export default reviewFeedbackRoutes;
