import UserSettings from "../models/UserSettings";
import Seller from "../models/Seller";
import { IUserSettings, ISeller } from "../types";
import logger from "../config/loggingConfig";

// Function to fetch map center by user ID
export const getMapCenterById = async (map_center_id: string): Promise<{ search_map_center: any, sell_map_center: any } | null> => {
  try {
    // Fetch search map center from UserSettings
    const userSettings = await UserSettings.findOne({ user_settings_id: map_center_id }).exec();
    const searchMapCenter = userSettings?.search_map_center || null;

    // Fetch sell map center from Seller
    const seller = await Seller.findOne({ seller_id: map_center_id }).exec();
    const sellMapCenter = seller?.sell_map_center || null;

    if (!searchMapCenter && !sellMapCenter) {
      logger.warn(`No map centers found for user ${map_center_id}`);
      return null;
    }

    logger.info(`Map centers retrieved successfully for user ${map_center_id}`);
    return { search_map_center: searchMapCenter, sell_map_center: sellMapCenter };
  } catch (error: any) {
    logger.error(`Error retrieving map center with PI_UID ${map_center_id}: ${error.message}`);
    throw new Error(error.message);
  }
};
