import Bottleneck from "bottleneck";

import SanctionedRegion from "../models/misc/SanctionedRegion";
import { getSellersWithinSanctionedRegion } from "./seller.service";
import { reverseLocationDetails } from "../helpers/location";
import { ISanctionedRegion, ISeller, SanctionedSeller } from "../types";
import logger from "../config/loggingConfig";

const requestLimiter = new Bottleneck({ minTime: 1000 });

export const reportSanctionedSellers = async (): Promise<SanctionedSeller[]> => {
  const sanctionedSellers: SanctionedSeller[] = [];

  try {
    // fetch sanctioned regions from Mongo DB collection
    const sanctionedRegions = await getAllSanctionedRegions();
    if (!sanctionedRegions.length) {
      return [];
    } 

    // determine potential sanctioned sellers
    for (const region of sanctionedRegions) {
      // fetch affected sellers within the current sanctioned region
      const sellersInRegion = await getSellersWithinSanctionedRegion(region);

      // geocode and validate each affected seller using Nominatim API
      const results = await Promise.all(
        sellersInRegion.map((seller) => processSellerGeocoding(seller, region.location))
      );
      sanctionedSellers.push(...results.filter((result): result is SanctionedSeller => result !== null));
    }

    if (sanctionedSellers.length > 0) {
      logger.info(`Total number of sanctioned sellers: ${sanctionedSellers.length}`);
      logger.error(`Sanctioned Sellers Report | ${sanctionedSellers.length} found: ${JSON.stringify(sanctionedSellers, null, 2)}`);
    } else {
      logger.info('No sellers found in any sanctioned regions');
    }
  } catch (error) {
    // Capture any errors and send to Sentry
    logger.error('An error occurred while generating the Sanctioned Sellers Report:', error);
    throw new Error('Failed to generate Sanctioned Sellers Report; please try again later.');
  }
  return sanctionedSellers;
};

// Fetch all sanctioned regions
const getAllSanctionedRegions = async (): Promise<ISanctionedRegion[]> => {
  try {
    const regions = await SanctionedRegion.find();
    if (!regions || regions.length === 0) {
      logger.warn('No sanctioned regions found');
      return [];
    }
    logger.info(`Fetched ${regions.length} sanctioned regions`);
    return regions;
  } catch (error) {
    logger.error('Failed to fetch sanctioned regions:', error);
    throw new Error('Failed to get sanctioned regions; please try again later');
  }
};

// Function to handle geocoding for a single seller
const processSellerGeocoding = async (
  seller: ISeller, 
  sanctionedRegion: string
): Promise<SanctionedSeller | null> => {
  const { seller_id, name, address, sell_map_center } = seller;
  const [longitude, latitude] = sell_map_center.coordinates;

  try {
    const response = await requestLimiter.wrap(reverseLocationDetails)(latitude, longitude);

    if (response.data.error) {
      logger.error(`Geocoding error for seller ${seller_id}`, {
        coordinates: [latitude, longitude],
        error: response.data.error,
      });
      return null;
    }

    const locationName = response.data.display_name;
    if (locationName.includes(sanctionedRegion)) {
      logger.info('Sanctioned Seller found', { seller_id, name, address, coordinates: [latitude, longitude], sanctioned_location: locationName });
      return { 
        seller_id,
        name,
        address,
        sell_map_center, 
        sanctioned_location: locationName 
      };
    }
  } catch (error) {
    logger.error(`Geocoding failed for seller ${seller_id}`, { coordinates: [latitude, longitude], error });
  }
  return null;
};