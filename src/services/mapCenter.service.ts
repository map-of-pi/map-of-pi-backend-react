import MapCenter from "../models/MapCenter";
import { IMapCenter } from "../types";

import logger from "../config/loggingConfig";

export const getMapCenterById = async (map_center_id: string): Promise<IMapCenter | null> => {
  try {
    const mapCenter = await MapCenter.findOne({ map_center_id }).exec();
    return mapCenter ? mapCenter as IMapCenter : null;
  } catch (error: any) {
    logger.error(`Failed to retrieve Map Center for mapCenterID ${ map_center_id }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to retrieve Map Center; please try again later');
  }
};

export const createOrUpdateMapCenter = async (
  map_center_id: string, 
  longitude: number,
  latitude: number, 
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
    logger.error(`Failed to create or udpate Map Center for ${ type }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to create or update Map Center; please try again later');
  }
};
