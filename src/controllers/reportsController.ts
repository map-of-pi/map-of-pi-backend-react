import {Request, Response} from "express";
import {reportSanctionedSellers} from "../services/report.service";
import logger from "../config/loggingConfig";

export const getSanctionedSellersReport = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Generating Sanctioned Sellers Report..' });
  setImmediate(async () => {
    try {
      await reportSanctionedSellers();
      logger.info('Sanctioned Sellers Report generated successfully');
    } catch (error) {
      logger.error('An error occurred while generating Sanctioned Sellers Report:', error);
    }
  })
};
