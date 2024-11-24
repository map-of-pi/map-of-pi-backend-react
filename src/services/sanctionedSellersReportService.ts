import {env} from "../utils/env";
import logger from "../config/loggingConfig";
import {ISeller} from "../types";
import Bottleneck from "bottleneck";
import {getAllSellers} from "./seller.service";
import * as Sentry from "@sentry/node";
import {isInSanctionedRegion, reverseLocationDetails} from "../helpers/sellerReportHelpers";

Sentry.init({dsn: env.SENTRY_DSN});
const requestLimiter = new Bottleneck({minTime: 1000});
const processedSellersCache = new Set();
let sanctionedSellers: ISeller[] = [];
let geocodingErrors: ISeller[] = [];

export const filterSanctionedSellers = async (seller: ISeller) => {
  try {
    logger.info(`Checking Pioneer's region.`);

    const { seller_id, name } = seller;
    const [longitude, latitude] = seller.sell_map_center.coordinates;

    let response = await reverseLocationDetails(latitude, longitude);

    if (response.data.error) {
      const errorMessage = response.data.error;
      logger.error(`Geocoding error for seller ${seller_id} with original coordinates: ${errorMessage}`);

      logger.info(`Retrying geocoding with swapped coordinates for seller ${seller_id}.`);
      response = await reverseLocationDetails(longitude, latitude);

      if (response.data.error) {
        const retryErrorMessage = response.data.error;
        logger.error(`Geocoding retry error for seller ${seller_id} with swapped coordinates: ${retryErrorMessage}`);
        geocodingErrors.push(seller);
        processedSellersCache.add(seller_id);
        return;
      }
    }

    const locationData = response.data;
    const locationName = locationData.display_name;
    logger.info(
      `Seller location: ${locationName}, from coordinates: latitude: ${latitude}, longitude: ${longitude}`
    );

    if (isInSanctionedRegion(locationName)) {
      logger.warn(
        `Pioneer is selling in a restricted area | ${seller_id} | ${name} | ${latitude} | ${longitude} | ${locationName}`
      );
      sanctionedSellers.push(seller);
    }

    processedSellersCache.add(seller_id);
  } catch (error) {
    logger.error("Error checking seller location for seller:", error);
  }
};



export const reportSanctionedSellers = async () => {
  const sellers = await getAllSellers();
  sanctionedSellers = [];
  logger.info(`Total number of sellers: ${sellers.length}`);
  await processSellers(sellers);
  if(sanctionedSellers.length > 0){
    logger.info(`Total number of blacklisted sellers: ${sanctionedSellers.length}`)
    logger.info("Generating Weekly Report on Sanctioned Sellers");
    Sentry.captureMessage("Weekly Sanctioned Sellers Report", {
      level: "info",
      extra: {sanctionedSellers}
    });
    logger.error(`Weekly report data on Sanctioned Sellers: ${sanctionedSellers}`);
  }

  if(geocodingErrors.length > 0){
    logger.info(`Total number of sellers with geocoded error locations: ${geocodingErrors.length}`);
    Sentry.captureMessage("Failed to geocode Sellers location", {
      level: "info",
      extra: {geocodeErrors: geocodingErrors},
    });
  }
}

const processSellers = async (sellers : ISeller[]) => {
  const sellerPromises = sellers.map(async (seller) => {
    if (!processedSellersCache.has(seller.id)) {
      await fetchSellerLocation(seller);
    }
  });

  await Promise.all(sellerPromises);
}

const fetchSellerLocation = requestLimiter.wrap(filterSanctionedSellers);

