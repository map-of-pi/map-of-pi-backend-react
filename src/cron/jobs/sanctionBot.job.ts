import Seller from "../../models/Seller";
import { SellerType } from "../../models/enums/sellerType";
import { getAllSanctionedRegions, processSellerGeocoding } from "../../services/admin/report.service";
import { createBulkPreRestrictionOperation, createGeoQueries } from "../utils/geoUtils";
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
    
    /* Step 3: Create geo-based queries to find sellers in the pre-defined sanctioned regions */
    const geoQueries = createGeoQueries(sanctionedRegions);
    /* Step 4: Find all sellers whose location matches any of the geoQueries (in restricted regions) */
    const sellersInRestrictedRegions = await Seller.find({ $or: geoQueries }).exec();
    logger.info(`Found ${sellersInRestrictedRegions.length} sellers within a sanctioned region.`);
    
    /* Step 5: Create the bulk update operations to mark sellers as pre-restricted */
    const bulkPreRestrictionOps = createBulkPreRestrictionOperation(sellersInRestrictedRegions);
    if (bulkPreRestrictionOps.length > 0) {
      await Seller.bulkWrite(bulkPreRestrictionOps);
      logger.info(`Marked ${bulkPreRestrictionOps.length} sellers as Pre-Restricted`)
    }

    /* Step 6: Retrieve all sellers who are marked as pre-restricted */
    const sellersInRegion = await Seller.find({ isPreRestricted: true }).exec();
    logger.info(`${sellersInRegion.length} sellers are Pre-Restricted`);

    /* Step 7: For each sanctioned region, process the geocoding for each pre-restricted seller */
    for (const region of sanctionedRegions) {
      // Process each seller for geocoding and check if they are sanctioned by invoking Nominatim API
      const sanctionedSellerResults = await Promise.all(
        sellersInRegion.map((seller) => processSellerGeocoding(seller, region.location))
      );

      logger.info(`Sanctioned sellers result: ${sanctionedSellerResults.length} sellers processed out of ${sellersInRegion.length} sellers in sanctioned regions.`);

      /* Step 8: For each seller, create the bulk update operations to update their status to "Restricted" */
      const bulkOpsPromises = sanctionedSellerResults.map(async (sellerResult) => {
        const seller = await Seller.findOne({ seller_id: sellerResult!.seller_id }).exec();
        return {
          updateOne: {
            filter: { seller_id: seller!.seller_id },
            update: {
              // Set seller type to "Restricted" and pre_restriction_seller_type if it is not already set
              $set: { seller_type: SellerType.Restricted },
              $setOnInsert: { pre_restriction_seller_type: seller!.pre_restriction_seller_type || '' },
            },
          },
        }
      });

      /* Step 9: Execute the bulk operations to update sellers to "Restricted" status */
      const bulkOps = await Promise.all(bulkOpsPromises);
      if (bulkOps.length > 0) {
        await Seller.bulkWrite(bulkOps);
        logger.info(`Applied bulk restrictions to sellers found in restricted regions`);
      }
    }
  } catch (error) {
    logger.error('Error in Sanction Bot cron job:', error);
  }
}