import Seller from "../../models/Seller";
import { SanctionedSellerStatus } from "../../types";
import { getAllSanctionedRegions } from "../../services/admin/report.service";
import { 
  createBulkPreRestrictionOperation, 
  createGeoQueries 
} from "../utils/geoUtils";
import {
  getSellersToEvaluate,
  processSellersGeocoding,
  processSanctionedSellers,
  processUnsanctionedSellers
} from "../utils/sanctionUtils";
import logger from "../../config/loggingConfig";

export async function runSanctionBot(): Promise<void> {
  logger.info('Sanction Bot cron job started.');

  try {
    /* Step 1: Reset the 'isPreRestricted' field to 'false' for all sellers
       This clears any pre-existing restrictions before applying new ones. */
    await Seller.updateMany({}, { isPreRestricted: false }).exec();
    logger.info('Reset [isPreRestricted] for all sellers.');

    /* Step 2: Get the list of all sanctioned regions */
    const sanctionedRegions = await getAllSanctionedRegions();
    // If no sanctioned regions are found, log the info and exit the job
    if (!sanctionedRegions.length) {
      logger.info('No sanctioned regions found. Exiting job.');
      return;
    }

    /* Step 3: Create geo-based queries and identify sellers to evaluate */
		const geoQueries = createGeoQueries(sanctionedRegions);
		const sellersToEvaluate = await getSellersToEvaluate(geoQueries);
		logger.info(`Evaluating ${sellersToEvaluate.length} sellers flagged or currently Restricted.`);

    /* Step 4: Create the bulk update operations to mark sellers as pre-restricted */
		const bulkPreRestrictionOps = createBulkPreRestrictionOperation(sellersToEvaluate);
		if (bulkPreRestrictionOps.length > 0) {
			await Seller.bulkWrite(bulkPreRestrictionOps);
			logger.info(`Marked ${bulkPreRestrictionOps.length} sellers as Pre-Restricted`)
		}

    /* Step 5: Retrieve all sellers who are marked as pre-restricted */
		const preRestrictedSellers = await Seller.find({isPreRestricted: true}).exec();
		logger.info(`${preRestrictedSellers.length} sellers are Pre-Restricted`);

		/* Step 6: Process geocoding validation */
    const results: SanctionedSellerStatus[] = await processSellersGeocoding(
      preRestrictedSellers,
      sanctionedRegions
    );
		const inZone = results.filter(r => r.isSanctionedRegion);
		const outOfZone = results.filter(r => !r.isSanctionedRegion);

    /* Step 7: Apply restrictions of in-zone sellers or restoration of out-zone sellers */
		await processSanctionedSellers(inZone);
		await processUnsanctionedSellers(outOfZone);

    /* Step 8: Clean up temp pre-restriction flags */
		await Seller.updateMany({isPreRestricted: true}, {isPreRestricted: false}).exec();
		logger.info('SanctionBot job completed.');
	} catch (error) {
		logger.error('Error in Sanction Bot cron job:', error);
	}
}