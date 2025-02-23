import { Request, Response } from "express";
import * as sellerMetricsService from "../../../services/misc/metrics/sellerMetrics.service";
import logger from "../../../config/loggingConfig";

export const getSellerMetrics = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const sellerMetrics = await sellerMetricsService.getAllSellers(page, limit);

    return res.status(200).json(sellerMetrics);
  } catch (error) {
    logger.error('Failed to fetch seller metrics', error);
    return res.status(500).json({
      message: 'An error occurred while fetching seller metrics; please try again later',
    });
  }
};
