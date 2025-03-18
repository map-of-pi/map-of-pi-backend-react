import logger from "../config/loggingConfig";
import Seller from "../models/Seller";
import {getAllSanctionedRegions, processSellerGeocoding} from "./report.service";
import {SellerType} from "../models/enums/sellerType";
import {ISanctionedRegion, ISeller} from "../types";

function createBulkPreRestrictionOperation(sellersInRestrictedRegions: ISeller[]) {
    return sellersInRestrictedRegions.map(seller => {
        // Create a single update object for $set that includes both fields.
        const setObj: any = { isPreRestricted: true };
        if (seller.seller_type !== SellerType.Restricted) {
            setObj.pre_restriction_seller_type = seller.seller_type;
        }
        return {
            updateOne: {
                filter: { seller_id: seller.seller_id },
                update: {
                    $set: setObj,
                },
            },
        };
    });
}

function createGeoQueries(sanctionedRegions: ISanctionedRegion[]) {
    return sanctionedRegions.map(region => ({
        sell_map_center: {
            $geoWithin: {
                $geometry: region.boundary,
            }
        }
    }));
}

export async function runSanctionBot(): Promise<void> {
    logger.info('SanctionBot job started.');

    try {
        await Seller.updateMany({}, {isPreRestricted: false}).exec();
        logger.info('Reset isPreRestricted for all sellers.');

        const sanctionedRegions = await getAllSanctionedRegions();

        if (!sanctionedRegions.length) {
            logger.info('No sanctioned regions found. Exiting job.');
            return;
        }
        const geoQueries = createGeoQueries(sanctionedRegions);

        const sellersInRestrictedRegions = await Seller.find({$or: geoQueries}).exec();
        logger.info(`Found ${sellersInRestrictedRegions.length} sellers within a sanctioned region.`);
        const bulkPreRestrictionOps = createBulkPreRestrictionOperation(sellersInRestrictedRegions);

        if (bulkPreRestrictionOps.length > 0) {
            await Seller.bulkWrite(bulkPreRestrictionOps);
            logger.info(`Marked ${bulkPreRestrictionOps.length} sellers as pre-restricted`)
        }

        const sellersInRegion = await Seller.find({isPreRestricted: true}).exec();

        logger.info(`Sellers with pre restriction ${sellersInRegion.length}`);

        for (const region of sanctionedRegions) {
            const sanctionedSellerResults = await Promise.all(
                sellersInRegion.map((seller) => processSellerGeocoding(seller, region.location))
            );

            logger.info(`Sanctioned sellers result ${sanctionedSellerResults.length} sellers were processed out of ${sellersInRegion.length} sellers in sanctioned regions.`);

            const bulkOpsPromises = sanctionedSellerResults
                .map(async (sellerResult) => {
                    const seller = await Seller.findOne({seller_id: sellerResult!.seller_id}).exec();
                    logger.info(`seller id: ${sellerResult!.seller_id}`)
                    return {
                        updateOne: {
                            filter: {seller_id: seller!.seller_id},
                            update: {
                                $set: {seller_type: SellerType.Restricted},
                                $setOnInsert: {pre_restriction_seller_type: seller!.pre_restriction_seller_type || ''},
                            },
                        },
                    }
                });

            const bulkOps = await Promise.all(bulkOpsPromises);

            if (bulkOps.length > 0) {
                await Seller.bulkWrite(bulkOps);
                logger.info(`Applied bulk restrictions to sellers found in restricted regions`);
            }
        }
    } catch (error) {
        logger.error('Error in SanctionBot job:', error);
    }
}