import { Request, Response } from "express";
import * as reviewFeedbackMetricsService from "../../../services/misc/metrics/reviewFeedbackMetrics.service";
import logger from "../../../config/loggingConfig";

export const getReviewMetrics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const reviewMetrics = await reviewFeedbackMetricsService.getAllReviews(page, limit);
    
    return res.status(200).json(reviewMetrics);
  } catch (error) {
    logger.error('Failed to fetch review metrics', error);
    return res.status(500).json({
      message: 'An error occurred while fetching review metrics; please try again later',
    });
  }
};
