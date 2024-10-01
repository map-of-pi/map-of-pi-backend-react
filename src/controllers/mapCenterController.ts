import { Request, Response } from 'express';

import * as mapCenterService from '../services/mapCenter.service'; 
import { IMapCenter } from '../types';

import logger from '../config/loggingConfig';

export const saveMapCenter = async (req: Request, res: Response) => {
  try {  
    const authUser = req.currentUser;
    // early authentication check
    if (!authUser) {
      logger.warn('User not found; Map Center failed to save');
      return res.status(404).json({ message: 'User not found: Map Center failed to save' });
    }

    const map_center_id = authUser.pi_uid;
    const { longitude, latitude, type } = req.body;
    const mapCenter = await mapCenterService.createOrUpdateMapCenter(map_center_id, longitude, latitude, type);
    logger.info(`${type === 'search' ? 'Search' : 'Sell'} Center saved successfully for user ${map_center_id} with Longitude: ${longitude}, Latitude: ${latitude} `);
    
    return res.status(200).json({uid: map_center_id, map_center: mapCenter});

  } catch (error: any) {
    logger.error('Failed to save Map Center:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while saving the Map Center; please try again later' });
  }
};

export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const map_center_id = req.currentUser?.pi_uid;
    const {type} = req.params;
    if (map_center_id) {
      const mapCenter: IMapCenter | null = await mapCenterService.getMapCenterById(map_center_id, type);
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
    logger.error('Failed to retrieve Map Center:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while getting the Map Center; please try again later' });
  }
};
