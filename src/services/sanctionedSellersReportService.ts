import {env} from "../utils/env";
import axios from 'axios';
import logger from "../config/loggingConfig";
import {ISeller} from "../types";
import Bottleneck from "bottleneck";
import {getAllSellers} from "./seller.service";
import * as Sentry from "@sentry/node";

Sentry.init({dsn: env.SENTRY_DSN});

const restrictedAreas = [
    "Cuba",
    "North Korea",
    "Iran",
    "Syria",
    "Republic of Crimea",
    "Donetsk Oblast",
    "Luhansk Oblast",
    "Accra"
];

const requestLimiter = new Bottleneck({minTime: 1000});
const reverseLocationUrl = "https://nominatim.openstreetmap.org/reverse";
const userAgent = "mapofpi/1.0 (mapofpi@gmail.com)";
const processedSellersCache = new Set();
let sanctionedSellers: ISeller[] = [];
let geocodingErrors: ISeller[] = [];


export const filterSanctionedSellers =async (seller : ISeller)=> {
    try {
        logger.info(`Checking Pioneer's region.`);

        const {seller_id, name} = seller;
        const [longitude, latitude] = seller.sell_map_center.coordinates;
        const response = await reverseLocationDetails(latitude, longitude);
        if(response.data.error){
           const errorMessage = response.data.error;
           logger.error(`Geocoding error for seller ${seller_id}: ${errorMessage}`);
           geocodingErrors.push(seller);
        }else {
            const locationData = await response.data;
            const locationName = locationData.display_name;
            logger.info(`Seller location: ${locationName}, from coordinates: latitude: ${latitude}, to coordinates: longitude: ${longitude}`);

            if (isInSanctionedRegion(locationName)) {
                logger.warn(`Pioneer is selling in a restricted area | ${seller_id} | ${name} | ${latitude} | ${longitude} } | ${locationName}`);
                sanctionedSellers.push(seller);
            }
        }
        processedSellersCache.add(seller_id);
    } catch (error) {
        logger.error(`Error checking seller location: `, error);
    }
};

const isInSanctionedRegion = (locationName: string) : boolean =>{
    return restrictedAreas.some(area => locationName.includes(area));
}

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
        logger.info(`Total number of sellers with geocoded locations: ${geocodingErrors.length}`);
        Sentry.captureMessage("Failed to geocode Sellers location", {
            level: "info",
            extra: {geocodeErrors: geocodingErrors},
        });
    }
}

const processSellers = async (sellers : ISeller[]) => {
    for(const seller of sellers) {
        if(!processedSellersCache.has(seller.id)){
            await fetchSellerLocation(seller);
        }
    }
}

const fetchSellerLocation = requestLimiter.wrap(filterSanctionedSellers);

const reverseLocationDetails = async (latitude: number, longitude: number) =>{
    return await axios.get(reverseLocationUrl, {
        headers: {
            "User-Agent": userAgent
        },
        params: {
            lat: latitude,
            lon: longitude,
            zoom: 6,
            format: "jsonv2"
        }
    });
}
