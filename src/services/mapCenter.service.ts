import MapCenter from "../models/MapCenter";
import { IMapCenter } from "../types";

import logger from "../config/loggingConfig";

export const getMapCenterById = async (map_center_id: string): Promise<IMapCenter | null> => {
  try {
    const mapCenter = await MapCenter.findOne({ map_center_id }).exec();
    return mapCenter ? mapCenter as IMapCenter : null;
  } catch (error: any) {
    logger.error(`Error retrieving map center with PI_UID ${map_center_id}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const createOrUpdateMapCenter = async (
  map_center_id: string, 
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
      { map_center_id },
      { $set: updateField }, 
      { new: true, upsert: true }  // upsert: true ensures that a new record is created if it doesn't exist
    );
    
    return mapCenter as IMapCenter;
  } catch (error: any) {
    logger.error(`Error creating or updating map center for ${type}: ${error.message}`);
    throw new Error(error.message);
  }
};
