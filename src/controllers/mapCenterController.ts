import { Request, Response } from 'express';
import Seller from '../models/Seller';
import UserSettings from '../models/UserSettings';
import logger from '../config/loggingConfig';

// Function to save or update the map center based on type ('search' or 'sell')
export const saveMapCenter = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    if (!authUser) {
      logger.warn('User not found; Map Center failed to save');
      return res.status(404).json({ message: 'User not found: Map Center failed to save' });
    }

    const map_center_id = authUser.pi_uid;
    const { longitude, latitude, type } = req.body;

    if (type === 'search') {
      // Save or update the search center in UserSettings
      const updateField = {
        search_map_center: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      };

      const updatedUserSettings = await UserSettings.findOneAndUpdate(
        { user_settings_id: map_center_id },
        { $set: updateField },
        { new: true, upsert: true }
      ).exec();

      logger.info(`Search Center saved successfully for user ${map_center_id}`);
      return res.status(200).json(updatedUserSettings?.search_map_center);

    } else if (type === 'sell') {
      // Save or update the sell center in Seller
      const updateField = {
        sell_map_center: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      };

      const updatedSeller = await Seller.findOneAndUpdate(
        { seller_id: map_center_id },
        { $set: updateField },
        { new: true, upsert: true }
      ).exec();

      if (updatedSeller) {
        logger.info(`Sell Center saved successfully for seller ${map_center_id}`);
        return res.status(200).json(updatedSeller?.sell_map_center);
      } else {
        logger.warn(`Seller not found for seller_id: ${map_center_id}. sell_map_center not updated.`);
        return res.status(404).json({ message: 'Seller not found: Map Center failed to save' });
      }
    } else {
      logger.warn(`Invalid type provided: ${type}`);
      return res.status(400).json({ message: 'Invalid type provided' });
    }

  } catch (error: any) {
    logger.error(`Error saving map center: ${error.message}`);
    return res.status(500).json({ message: 'An error occurred while saving the map center; please try again later' });
  }
};

// Function to get the map center (either search or sell) with fallback logic
export const getMapCenter = async (req: Request, res: Response) => {
  try {
    const map_center_id = req.currentUser?.pi_uid;
    if (map_center_id) {
      // Fetch search center from UserSettings
      const userSettings = await UserSettings.findOne({ user_settings_id: map_center_id }).exec();
      const searchMapCenter = userSettings?.search_map_center || null;

      // Fetch sell center from Seller
      const seller = await Seller.findOne({ seller_id: map_center_id }).exec();
      const sellMapCenter = seller?.sell_map_center || null;

      // Safely check if sell_map_center and its coordinates exist
      const hasSellCenter = sellMapCenter && sellMapCenter.coordinates?.length > 0;

      // Fallback logic: If sell_map_center is empty or not set, default to search_map_center
      const finalSellCenter = hasSellCenter ? sellMapCenter : searchMapCenter;

      // If neither map center is found, respond accordingly
      if (!searchMapCenter && !sellMapCenter) {
        logger.warn(`Map Center not found for user ${map_center_id}`);
        return res.status(404).json({ message: "Map Center not found" });
      }

      logger.info(`Map Center retrieved successfully for user ${map_center_id}`);
      return res.status(200).json({
        sell_map_center: finalSellCenter,
        search_map_center: searchMapCenter,
      });
    } else {
      logger.warn('No user found; cannot retrieve Map Center.');
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    logger.error(`Failed to retrieve Map Center: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
