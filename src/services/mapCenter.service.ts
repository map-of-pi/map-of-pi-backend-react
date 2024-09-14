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
  type: 'search' | 'sell'
): Promise<IMapCenter> => {
  try {
    const updateField = type === 'search' 
      ? { 
          search_map_center: {
            type: 'Point',
            coordinates: [longitude, latitude],
          }
        }
      : { 
          sell_map_center: {
            type: 'Point',
            coordinates: [longitude, latitude],
          }
        };

    const mapCenter = await MapCenter.findOneAndUpdate(
      { pi_uid },
      { $set: updateField },  // Use $set to update nested objects
      { new: true, upsert: true }
    );
    
    return mapCenter as IMapCenter;
  } catch (error: any) {
    logger.error(`Error creating or updating map center for ${type}: ${error.message}`);
    throw new Error(error.message);
  }
};


