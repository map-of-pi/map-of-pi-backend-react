import { Request, Response } from 'express';

import * as mapCenterService from '../services/mapCenter.service'; 
import { IMapCenter } from '../types';

import logger from '../config/loggingConfig';

export const saveMapCenter = async (req: Request, res: Response) => {
  try {  
    const authUser = req.currentUser;
    if (authUser) {    
      const map_center_id = authUser.pi_uid;
      const { latitude, longitude, type } = req.body;

      const mapCenter = await mapCenterService.createOrUpdateMapCenter(map_center_id, latitude, longitude, type);
      logger.info(`${type === 'search' ? 'Search' : 'Sell'} Center saved successfully for user ${map_center_id} with Latitude: ${latitude}, Longitude: ${longitude}`);
      
      return res.status(200).json(mapCenter);
    } else {
      logger.warn('User not found; Map Center failed to save');
      return res.status(404).json({ message: 'User not found: Map Center failed to save' });
    }
  } catch (error: any) {
    logger.error(`Failed to save Map Center: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const map_center_id = req.currentUser?.pi_uid;
    if (map_center_id) {
      const mapCenter: IMapCenter | null = await mapCenterService.getMapCenterById(map_center_id);
      if (!mapCenter) {
        logger.warn(`Map Center not found for user ${map_center_id}`);
        return res.status(404).json({ message: "Map Center not found" });
      }
      logger.info(`Map Center retrieved successfully for user ${map_center_id}`);
      return res.status(200).json(mapCenter);
    } else {
      logger.warn('No user found; cannot retrieve Map Center.');
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    logger.error(`Failed to retrieve Map Center: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
