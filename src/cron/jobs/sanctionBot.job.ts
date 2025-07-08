import logger from "../../config/loggingConfig";
import {findAndRestrictSanctionedSellers} from "../utils/sanction.botUtils";

export async function runSanctionBot(): Promise<void> {
  logger.info('Sanction Bot cron job started.');

  try {
    await findAndRestrictSanctionedSellers();
    logger.info('SanctionBot job completed.');
  } catch (error) {
    logger.error('Error in Sanction Bot cron job:', error);
  }
}
