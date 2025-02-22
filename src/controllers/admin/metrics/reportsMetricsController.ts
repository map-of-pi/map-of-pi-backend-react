import { Request, Response } from "express";
import * as reportMetricsService from "../../../services/misc/metrics/reportMetrics.service";
import logger from "../../../config/loggingConfig";

export const getRestrictedAreaMetrics = async (req: Request, res: Response) => {
  try {
    const restrictedAreas = await reportMetricsService.getAllRestrictedAreas();
    return res.status(200).json({ restrictedAreas });
  } catch (error) {
    logger.error('Failed to get restricted areas', error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching restricted areas",
      error: error
    });
  }
}

export const createSanctionedRegion = async (req: Request, res: Response) => {
  try {
    const { location, boundary } = req.body;

    const newSanctionedRegion = await reportMetricsService.addSanctionedRegion(location, boundary);

    return res.status(201).json({
      success: true,
      message: "Sanctioned region created successfully",
      data: newSanctionedRegion
    });
  } catch (error) {
    logger.error('Failed to create sanctioned region', error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating sanctioned region",
      error: error
    });
  }
}