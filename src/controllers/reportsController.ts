import {Request, Response} from "express";
import {reportSanctionedSellers} from "../services/sanctionedSellersReportService";
import logger from "../config/loggingConfig";

export const getSanctionedSellersReport = async (req:Request, res:Response) => {
  res.status(200).json({message: "Report on sanctioned sellers is being generated and will be available on Sentry soon."});
  setImmediate(async () => {
    try{
      await reportSanctionedSellers();
      logger.info("Sanctioned Sellers Report generated successfully")
    }catch(error){
      logger.error("An error occurred while generating report:", error);
    }
  })
};
