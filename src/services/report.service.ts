import Bottleneck from "bottleneck";

import {getSellersWithinSanctionedRegion} from "./seller.service";
import {reverseLocationDetails, isRestrictedLocation} from "../helpers/location";
import { RestrictedAreas } from "../models/enums/restrictedAreas";
import {ISeller, SanctionedSeller} from "../types";
import logger from "../config/loggingConfig";

const requestLimiter = new Bottleneck({ minTime: 1000 });

export const reportSanctionedSellers = async (): Promise<SanctionedSeller[]> => {
  const sanctionedSellers: SanctionedSeller[] = [];

  try {
    // determine potential sanctioned sellers
    for (const region of Object.values(RestrictedAreas)) {
      // fetch affected sellers in the current restricted region
      const sellersInRegion = await getSellersWithinSanctionedRegion(region);

      // geocode and validate each affected seller using Nominatim API
      const results = await Promise.all(
        sellersInRegion.map((seller) => processSellerGeocoding(seller))
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

// Function to handle geocoding for a single seller
const processSellerGeocoding = async (seller: ISeller): Promise<SanctionedSeller | null> => {
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
    if (isRestrictedLocation(locationName)) {
      logger.info(`Sanctioned Seller found`, { seller_id, name, address, sanctioned_location: locationName });
      return { 
        seller_id,
        name,
        address, 
        sanctioned_location: locationName 
      };
    }
  } catch (error) {
    logger.error(`Geocoding failed for seller ${seller_id}`, { coordinates: [latitude, longitude], error });
  }

  return null;
};