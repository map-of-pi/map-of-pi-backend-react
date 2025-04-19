import Seller from "../../models/Seller";
import { SellerType } from "../../models/enums/sellerType";
import { ISanctionedRegion, ISeller } from "../../types";
import { processSellerGeocoding } from "../../services/admin/report.service";
import logger from "../../config/loggingConfig";

export interface ProcessedSellerResult {
  seller_id: string;
  pre_restriction_seller_type: SellerType | null | undefined;
  inZone: boolean;
}

interface GeoQuery {
  sell_map_center: {
    $geoWithin: {
      $geometry: {
        type: "Polygon";
        coordinates: [[[number, number]]];
      };
    };
  };
}

export async function getSellersToEvaluate(geoQueries: GeoQuery[]) {
  return await Seller.find({
    $or: [
      ...geoQueries,
      { seller_type: SellerType.Restricted }
    ]
  }).exec();
}

export async function processSellersGeocoding(
  flagged: ISeller[], 
  sanctionedRegions: ISanctionedRegion[]
): Promise<ProcessedSellerResult[]> {
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

export async function processInZoneSellers(inZone: ProcessedSellerResult[]) {
	if (!inZone.length) return;
  
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
  logger.info(`Restricted ${inZone.length} in-zone sellers.`);
}

export async function processOutZoneSellers(outOfZone: ProcessedSellerResult[]) {
	if (!outOfZone.length) return;

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
  logger.info(`Restored ${outOfZone.length} out-zone sellers.`, {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
}
