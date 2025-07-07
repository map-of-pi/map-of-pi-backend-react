import Seller from "../../models/Seller";
import { SellerType } from "../../models/enums/sellerType";
import { ISanctionedRegion, ISeller, SanctionedSellerStatus } from "../../types";
import { processSellerGeocoding } from "../../services/admin/report.service";
import logger from "../../config/loggingConfig";
import SanctionedGeoBoundary from "../../models/misc/SanctionedGeoBoundary";
import * as turf from '@turf/turf';

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
  flaggedSellers: ISeller[], 
  sanctionedRegions: ISanctionedRegion[]
): Promise<SanctionedSellerStatus[]> {
	return await Promise.all(
		flaggedSellers.map(async seller => {
			for (const region of sanctionedRegions) {
				const match = await processSellerGeocoding(seller, region.location);
				if (match) return {
					seller_id: match.seller_id,
					pre_restriction_seller_type: match.pre_restriction_seller_type ?? null,
					isSanctionedRegion: true
				};
			}
			return {
				seller_id: seller.seller_id,
				pre_restriction_seller_type: seller.pre_restriction_seller_type ?? null,
				isSanctionedRegion: false
			};
		})
	);
}

export async function processSanctionedSellers(inZone: SanctionedSellerStatus[]) {
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
  logger.info(`Restricted ${inZone.length} sanctioned sellers.`);
}

export async function processUnsanctionedSellers(outOfZone: SanctionedSellerStatus[]) {
	if (!outOfZone.length) return;

  const result = await Seller.bulkWrite(
    outOfZone.map(s => ({
      updateOne: {
        filter: {seller_id: s.seller_id},
        update: {
          $set: {
            seller_type: s.pre_restriction_seller_type ?? SellerType.Test,
            pre_restriction_seller_type: null
          },
        }
      }
    }))
  );
  logger.info(`Restored ${outOfZone.length} sellers.`);
}

export async function findAndRestrictSanctionedSellers() {
  // Step 1: Fetch sanctioned regions
  const boundaries = await SanctionedGeoBoundary.find({}, { geometry: 1 }).lean();

  // Step 2: Convert to valid Turf polygons
  const turfPolygons = parseToValidTurfPolygons(boundaries);

  if (turfPolygons.length === 0) {
    console.warn('⚠️ No valid polygons found. Aborting restriction check.');
    return [];
  }

  // Step 3: Compute bounding box of all polygons
  const featureCollection = turf.featureCollection(turfPolygons);
  const [minX, minY, maxX, maxY] = turf.bbox(featureCollection);

  // Step 4: Prefilter sellers within the bbox
  const boundingBoxFilteredSellers = await Seller.find({
    sell_map_center: {
      $geoWithin: {
        $box: [
          [minX, minY],
          [maxX, maxY]
        ]
      }
    }
  }).lean();

  // Step 5: Turf-level precision check
  const sanctionedSellerIds = boundingBoxFilteredSellers
    .filter(seller => {
      const point = turf.point(seller.sell_map_center.coordinates);
      return turfPolygons.some(polygon => turf.booleanPointInPolygon(point, polygon));
    })
    .map(seller => seller._id.toString());

  // Step 6: Update sellers
  if (sanctionedSellerIds.length > 0) {
    await Seller.updateMany(
      { _id: { $in: sanctionedSellerIds } },
      { $set: { isRestricted: true } }
    );
  }

  console.info('✅ Sanction check complete. Restricted seller count:', sanctionedSellerIds.length);
  return sanctionedSellerIds;
}



export function parseToValidTurfPolygons(boundaries: any[]) {
  const turfPolygons: any[] = [];

  function closeRingIfNeeded(ring: number[][]): number[][] {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return [...ring, first];
    }
    return ring;
  }

  for (const boundary of boundaries) {
    const geometry = boundary.geometry;
    const type = geometry.type;

    try {
      if (type === 'Polygon') {
        const rings = geometry.coordinates.map(closeRingIfNeeded);
        if (rings[0].length >= 4) {
          turfPolygons.push(turf.polygon(rings));
        } else {
          console.warn('Skipping Polygon: too few coordinates');
        }
      } else if (type === 'MultiPolygon') {
        for (const coords of geometry.coordinates) {
          const rings = coords.map(closeRingIfNeeded);
          if (rings[0].length >= 4) {
            turfPolygons.push(turf.polygon(rings));
          } else {
            console.warn('Skipping MultiPolygon part: too few coordinates');
          }
        }
      } else {
        console.warn('Skipping unknown geometry type:', type);
      }
    } catch (err: any) {
      console.warn(`Failed to parse polygon: ${err.message}`, boundary._id?.toString());
    }
  }

  return turfPolygons;
}

