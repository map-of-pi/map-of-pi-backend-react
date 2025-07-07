import {findAndRestrictSanctionedSellers} from "../utils/sanctionUtils";
import logger from "../../config/loggingConfig";

export async function runSanctionBot(): Promise<void> {
  logger.info('Sanction Bot cron job started.');

  try {
		const sanctionedSellerIds = await findAndRestrictSanctionedSellers()
		logger.info("sanctionedSellerIds: {}", sanctionedSellerIds);
	} catch (error) {
		logger.error('Error in Sanction Bot cron job:', error);
	}
}