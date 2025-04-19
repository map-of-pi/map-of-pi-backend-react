import Seller from "../../models/Seller";
import {SellerType} from "../../models/enums/sellerType";
import {getAllSanctionedRegions, processSellerGeocoding} from "../../services/admin/report.service";
import {createBulkPreRestrictionOperation, createGeoQueries} from "../utils/geoUtils";
import logger from "../../config/loggingConfig";
import {ISanctionedRegion, ISeller} from "../../types";

interface ProcessedSellerResult {
	seller_id: string;
	pre_restriction_seller_type: SellerType | null | undefined;
	inZone: boolean;
}

interface GeoQuery {
	sell_map_center: {
		$geoWithin: {
			$geometry: {
				type: "Polygon";
				coordinates: [[[number, number]]]
			}
		}
	};
}

export async function runSanctionBot(): Promise<void> {
	logger.info('Sanction Bot cron job started.');

	try {

		await Seller.updateMany({}, {isPreRestricted: false}).exec();

		logger.info('Reset [isPreRestricted] for all sellers.');

		const sanctionedRegions = await getAllSanctionedRegions();

		if (!sanctionedRegions.length) {
			logger.info('No sanctioned regions found. Exiting job.');
			return;
		}

		const geoQueries = createGeoQueries(sanctionedRegions);

		const sellersToEvaluate = await getSellersToEvaluate(geoQueries);

		logger.info(`Evaluating ${sellersToEvaluate.length} sellers (in‑zone or already Restricted).`);

		const bulkPreRestrictionOps = createBulkPreRestrictionOperation(sellersToEvaluate);

		if (bulkPreRestrictionOps.length > 0) {
			await Seller.bulkWrite(bulkPreRestrictionOps);
			logger.info(`Marked ${bulkPreRestrictionOps.length} sellers as Pre-Restricted`)
		}

		const preRestrictedSellers = await Seller.find({isPreRestricted: true}).exec();

		logger.info(`${preRestrictedSellers.length} sellers are Pre-Restricted`);

		const results = await processSellersGeocoding(preRestrictedSellers, sanctionedRegions);

		const inZone = results.filter(r => r.inZone);

		const outOfZone = results.filter(r => !r.inZone);

		logger.info(`In zone sellers: ${inZone.length} sellers; Out zone sellers: ${outOfZone.length} sellers`);

		await processInZoneSellers(inZone);

		await processOutZoneSellers(outOfZone);

		await Seller.updateMany({isPreRestricted: true}, {isPreRestricted: false}).exec();

		logger.info('SanctionBot job completed.');

	} catch (error) {
		logger.error('Error in Sanction Bot cron job:', error);
	}
}

async function processInZoneSellers(inZone: ProcessedSellerResult[]) {
	if (inZone.length) {
		await Seller.bulkWrite(
			inZone.map(r => ({
				updateOne: {
					filter: {seller_id: r.seller_id},
					update: {
						$set:
							{
								seller_type: SellerType.Restricted,
								pre_restriction_seller_type: r.pre_restriction_seller_type
							}
					}
				}
			}))
		);
		logger.info(`Restricted ${inZone.length} sellers still in sanctioned zones.`);
	}
}

async function processOutZoneSellers(outOfZone: ProcessedSellerResult[]) {
	if (outOfZone.length) {
		const result = await Seller.bulkWrite(
			outOfZone.map(s => ({
				updateOne: {
					filter: {seller_id: s.seller_id},
					update: {
						$set: {
							seller_type: s.pre_restriction_seller_type ?? SellerType.Test,
							pre_restriction_seller_type: ""
						},
					}
				}
			}))
		);
		logger.info(`Restored ${outOfZone.length} sellers out of zone.`, {
			matchedCount: result.matchedCount,
			modifiedCount: result.modifiedCount,
		});
	}
}

async function getSellersToEvaluate(geoQueries: GeoQuery[]) {
	return await Seller.find({
		$or: [
			...geoQueries,
			{seller_type: SellerType.Restricted}
		]
	}).exec();
}

async function processSellersGeocoding(flagged: ISeller[], sanctionedRegions: ISanctionedRegion[]): Promise<ProcessedSellerResult[]> {
	return await Promise.all(
		flagged.map(async seller => {
			for (const region of sanctionedRegions) {
				const match = await processSellerGeocoding(seller, region.location);
				if (match) return {
					seller_id: match.seller_id,
					pre_restriction_seller_type: match.pre_restriction_seller_type,
					inZone: true
				};
			}
			return {
				seller_id: seller.seller_id,
				pre_restriction_seller_type: seller.pre_restriction_seller_type,
				inZone: false
			};
		})
	);
}