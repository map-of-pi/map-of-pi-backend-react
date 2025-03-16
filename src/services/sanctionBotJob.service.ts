import logger from "../config/loggingConfig";
import Seller from "../models/Seller";
import {getAllSanctionedRegions, processSellerGeocoding} from "./report.service";
import {SellerType} from "../models/enums/sellerType";
import {ISeller} from "../types";
import SanctionedRegion from "../models/misc/SanctionedRegion";

const schedule = require("node-schedule");

/**
 * Dummy helper: Check if the seller's Sell Centre is within one of the coarse grid polygons.
 * Replace with your actual geospatial query logic against your RestrictedArea table.
 */
async function isWithinRestrictedGrid(seller: ISeller) {
  const point = {
    type: 'Point',
    coordinates: seller.sell_map_center.coordinates,
  };
  const restrictedArea = await SanctionedRegion.findOne({
    geometry: {
      $geoIntersects: {
        $geometry: point,
      },
    },
  });
  return !!restrictedArea;
}


/**
 * Main function for the SanctionBot job.
 */
export async function runSanctionBot(): Promise<void> {
  logger.info('SanctionBot job started.');

  try {
    // Step 1: Reset isPreRestricted for all sellers.
    await Seller.updateMany({}, {isPreRestricted: false}).exec();
    logger.info('Reset isPreRestricted for all sellers.');

    // Step 2: Mark sellers as pre-restricted.
    const allSellers = await Seller.find().exec();
    for (const seller of allSellers) {
      const inGrid = await isWithinRestrictedGrid(seller);
      // Mark as pre-restricted if in restricted grid or already restricted.
      if (inGrid || seller.seller_type === SellerType.Restricted) {
        seller.isPreRestricted = true;
        // If seller is not already "Restricted", back up their seller type.
        if (seller.seller_type !== SellerType.Restricted) {
          seller.pre_restriction_seller_type = seller.seller_type;
        }
        await seller.save();
      }
    }
    logger.info('Marked sellers as pre-restricted based on grid check or existing restriction.');

    // Step 3: Process each seller with isPreRestricted = true.
    const sellersInRegion = await Seller.find({isPreRestricted: true}).exec();
    const sanctionedRegions = await getAllSanctionedRegions();

    for (const region of sanctionedRegions) {

      const sanctionedSellerResults = await Promise.all(
        sellersInRegion.map((seller) => processSellerGeocoding(seller, region.location))
      );

      const bulkOpsPromises = sanctionedSellerResults.filter(Boolean).map(async (sellerResult) => {
        const seller = await Seller.findOne({seller_id: sellerResult!.seller_id}).exec();
        return {
          updateOne: {
            filter: {seller_id: seller!.seller_id},
            update: {
              $set: {seller_type: SellerType.Restricted},
              // If needed, you can also back up the original type (if not already restricted)
              $setOnInsert: {pre_restriction_seller_type: seller!.pre_restriction_seller_type || null},
            },
          },
        }
      });

      const bulkOps = await Promise.all(bulkOpsPromises);

      if (bulkOps.length > 0) {
        await Seller.bulkWrite(bulkOps);
        logger.info(`Applied bulk restrictions to ${bulkOps.length} sellers for restricted region`);
      }
    }

    logger.info('SanctionBot job completed successfully.');
  } catch (error) {
    logger.error('Error in SanctionBot job:', error);
  }
}

const setRestrictedStatus = async (sellerId: string, regionName: string) => {
  const seller = await Seller.findOne({seller_id: sellerId}).exec();
  if (!seller) return;

  if (regionName) {
    // Restrict seller
    if (seller.seller_type !== SellerType.Restricted) {
      seller.pre_restriction_seller_type = seller.seller_type;
      seller.seller_type = SellerType.Restricted;
      logger.info(`Seller ${seller.seller_id} restricted due to region ${regionName}.`);
    }
  } else {
    // Restore seller
    if (seller.seller_type === SellerType.Restricted && seller.pre_restriction_seller_type) {
      seller.seller_type = seller.pre_restriction_seller_type as SellerType;
      seller.pre_restriction_seller_type = null;
      logger.info(`Seller ${seller.seller_id} restored to original type.`);
    }
  }
  await seller.save();
};

// Schedule the job to run daily at 22:00 UTC using node-schedule.
schedule.scheduleJob('0 22 * * *', () => {
  logger.info('Scheduled job triggered at 22:00 UTC.');
  runSanctionBot().then(() => logger.info(""));
});

