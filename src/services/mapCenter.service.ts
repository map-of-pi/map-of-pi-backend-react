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

export const createOrUpdateMapCenter = async (pi_uid: string, latitude: number, longitude: number): Promise<IMapCenter> => {
  try {
    const mapCenter = await MapCenter.findOneAndUpdate(
      { pi_uid },
      { latitude, longitude },
      { new: true, upsert: true }
    );
    return mapCenter as IMapCenter;
  } catch (error: any) {
    logger.error(`Error creating or updating map center: ${error.message}`);
    throw new Error(error.message);
  }
};
