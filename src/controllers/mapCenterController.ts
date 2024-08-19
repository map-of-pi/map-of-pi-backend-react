import { Request, Response } from 'express';

import * as mapCenterService from '../services/mapCenter.service'; 
import { IMapCenter } from '../types';

import logger from '../config/loggingConfig';

export const saveMapCenter = async (req: Request, res: Response) => {
  let authUser = req.currentUser;
  try {  
    if (authUser) {    
      const pi_uid = authUser.pi_uid;
      const { latitude, longitude } = req.body;
      const mapCenter = await mapCenterService.createOrUpdateMapCenter(pi_uid, latitude, longitude);
      logger.info(`Map Center saved successfully for user ${pi_uid} with Latitude: ${latitude}, Longitude: ${longitude}`);
      return res.status(200).json(mapCenter);
    } else {
      logger.warn('User not found; Map Center failed to save.');
      return res.status(404).json({ message: "User not found; Map Center failed to save" });
    }
  } catch (error: any) {
    logger.error(`Failed to save Map Center: ${error.message}`);
    res.status(500).json({ message: error.message });
  } 
};

export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const pi_uid = req.currentUser?.pi_uid;
    if (pi_uid) {
      const mapCenter: IMapCenter | null = await mapCenterService.getMapCenterById(pi_uid);
      if (!mapCenter) {
        logger.warn(`Map Center not found for user ${pi_uid}`);
        return res.status(404).json({ message: "Map Center not found" });
      }
      logger.info(`Map Center retrieved successfully for user ${pi_uid}`);
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
