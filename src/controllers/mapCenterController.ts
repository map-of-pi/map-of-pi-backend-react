import { Request, Response } from 'express';

import Seller from '../models/Seller';
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
    
    if (type === 'sell') {
      const sellMapCenter = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      // Update the seller's sell_map_center
      const updatedSeller = await Seller.findOneAndUpdate(
        { seller_id: map_center_id },
        { $set: { sell_map_center: sellMapCenter } },
        { new: true }
      ).exec();

      if (updatedSeller) {
        logger.info(`Seller's sell_map_center updated for seller_id: ${map_center_id}`, { updatedSeller });
      } else {
        logger.warn(`Seller not found for seller_id: ${map_center_id}. sell_map_center not updated.`);
        return res.status(404).json({ message: 'Seller not found: Map Center failed to save' });
      }
    }
    return res.status(200).json(mapCenter);

  } catch (error: any) {
    const errorMessage = 'An error occurred while saving the map center; please try again later';
    logger.error(`${errorMessage}: ${error}`);
    return res.status(500).json({ message: errorMessage });
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
