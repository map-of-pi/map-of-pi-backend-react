import Seller from "../../models/Seller";
import logger from "../../config/loggingConfig";
import SanctionedGeoBoundary from "../../models/misc/SanctionedGeoBoundary";
import * as turf from '@turf/turf';
import {addNotification} from "../../services/notification.service";
import {getCachedSanctionedBoundaries} from "./sanction.cache";


async function getSanctionedGeoBoundaries() {
  return SanctionedGeoBoundary.find({}, { geometry: 1 }).lean();
}

function computeBoundingBox(turfPolygons: any[]) {
  const featureCollection = turf.featureCollection(turfPolygons);
  const [minX, minY, maxX, maxY] = turf.bbox(featureCollection);
  return { minX, minY, maxX, maxY };
}

export function parseToValidTurfPolygons(boundaries: any[]) {
  const turfPolygons: any[] = [];

  function closeRingIfNeeded(ring: number[][]): number[][] {
    const first = ring[0];
    const last = ring[ring.length - 1];
    return (first[0] !== last[0] || first[1] !== last[1]) ? [...ring, first] : ring;
  }

  for (const boundary of boundaries) {
    const { geometry } = boundary;
    try {
      if (geometry.type === 'Polygon') {
        const rings = geometry.coordinates.map(closeRingIfNeeded);
        if (rings[0].length >= 4) turfPolygons.push(turf.polygon(rings));
        else logger.warn('Skipping Polygon: too few coordinates');
      } else if (geometry.type === 'MultiPolygon') {
        for (const coords of geometry.coordinates) {
          const rings = coords.map(closeRingIfNeeded);
          if (rings[0].length >= 4) turfPolygons.push(turf.polygon(rings));
          else logger.warn('Skipping MultiPolygon part: too few coordinates');
        }
      } else {
        logger.warn('Skipping unknown geometry type:', geometry.type);
      }
    } catch (err: any) {
      logger.warn(`❌ Failed to parse polygon: ${err.message}`, boundary._id?.toString());
    }
  }

  return turfPolygons;
}

export async function findAndRestrictSanctionedSellers() {
  const boundaries = await getCachedSanctionedBoundaries(getSanctionedGeoBoundaries);
  const turfPolygons = parseToValidTurfPolygons(boundaries);

  if (turfPolygons.length === 0) {
    logger.warn('⚠️ No valid polygons found. Aborting sanction check.');
    return;
  }

  const { minX, minY, maxX, maxY } = computeBoundingBox(turfPolygons);
  const sellers = await Seller.find({
    sell_map_center: {
      $geoWithin: {
        $box: [
          [minX, minY],
          [maxX, maxY],
        ]
      }
    }
  }).lean();

  const now = new Date();
  const updates = [];

  for (const seller of sellers) {
    const point = turf.point(seller.sell_map_center.coordinates);
    const isNowRestricted = turfPolygons.some(polygon => turf.booleanPointInPolygon(point, polygon));
    const wasRestricted = seller.isRestricted;

    if (wasRestricted && !isNowRestricted) {
      // Case #2: true → false → Update to unrestricted
      updates.push(
        Seller.updateOne({ _id: seller._id }, {
          $set: { isRestricted: false, lastSanctionUpdateAt: now }
        })
      );
      await addNotification(seller.seller_id, "The area containing your Sell Centre is no longer sanctioned by Pi Network, so your map marker will now be displayed in searches");
    } else if (!wasRestricted && isNowRestricted) {
      // Case #3: false → true → Update to restricted
      updates.push(
        Seller.updateOne({ _id: seller._id }, {
          $set: { isRestricted: true, lastSanctionUpdateAt: now }
        })
      );
      await addNotification(seller.seller_id, "The area containing your Sell Centre is sanctioned by Pi Network, so your map marker will now not be displayed in searches");
    }
    // Case #4: false → false → No action
  }

  if (updates.length > 0) await Promise.all(updates);

  logger.info(`✅ SanctionBot processed ${sellers.length} sellers. Updates: ${updates.length}`);
}
