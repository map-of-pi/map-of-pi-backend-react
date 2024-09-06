import MapCenter from "../models/MapCenter";
import { IMapCenter } from "../types";

import logger from "../config/loggingConfig";

export const getMapCenterById = async (pi_uid: string): Promise<IMapCenter | null> => {
  try {
    const mapCenter = await MapCenter.findOne({ pi_uid }).exec();
    return mapCenter ? mapCenter as IMapCenter : null;
  } catch (error: any) {
    logger.error(`Error retrieving map center with PI_UID ${pi_uid}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const createOrUpdateMapCenter = async (
  pi_uid: string, 
  latitude: number, 
  longitude: number,
  type: 'search' | 'sell'  // Add the type parameter to indicate search or sell
): Promise<IMapCenter> => {
  try {
    const updateField = type === 'search' 
      ? { search_map_center: { latitude, longitude } } 
      : { sell_map_center: { latitude, longitude } };

    const mapCenter = await MapCenter.findOneAndUpdate(
      { pi_uid },
      updateField,  // Dynamically update the correct field
      { new: true, upsert: true }
    );
    return mapCenter as IMapCenter;
  } catch (error: any) {
    logger.error(`Error creating or updating map center: ${error.message}`);
    throw new Error(error.message);
  }
};
