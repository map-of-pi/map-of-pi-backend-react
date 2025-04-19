import {Request, Response} from "express";
import {reportSanctionedSellers} from "../../services/admin/report.service";
import logger from "../../config/loggingConfig";

export const getSanctionedSellersReport = async (req: Request, res: Response) => {
  try {
    const sanctionedSellers = await reportSanctionedSellers();
    logger.info(`Sanctioned Sellers Report generated successfully with ${sanctionedSellers.length} sellers identified.`);
    return res.status(200).json({ 
      message: `${sanctionedSellers.length} Sanctioned seller(s) retrieved successfully`, 
      sanctionedSellers 
    });
  } catch (error) {
    logger.error('An error occurred while generating Sanctioned Sellers Report:', error);
    return res.status(500).json({ message: 'An error occurred while generating Sanctioned Sellers Report; please try again later' });
  }
};
