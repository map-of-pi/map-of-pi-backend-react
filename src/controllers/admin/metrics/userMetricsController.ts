import { Request, Response } from "express";
import * as userMetricsService from "../../../services/misc/metrics/userMetrics.service";
import logger from "../../../config/loggingConfig";

export const getTotalUserMetrics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const totalUserMetrics = await userMetricsService.getTotalUsers(page, limit);

    return res.status(200).json(totalUserMetrics);
  } catch (error) {
    logger.error('Failed to fetch total user metrics', error);
    return res.status(500).json({
      message: 'An error occurred while fetching total user metrics; please try again later',
    });
  }
};

export const getUserMetrics = async (req: Request, res: Response) => {
  try {
    const userMetrics = await userMetricsService.getUserStats();

    res.status(200).json(userMetrics);
  } catch (error) {
    logger.error('Failed to fetch user metrics', error);
    return res.status(500).json({
      message: 'An error occurred while fetching user metrics; please try again later',
    });
  }
};
