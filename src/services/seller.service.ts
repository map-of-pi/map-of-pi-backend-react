import Seller from "../models/Seller";
import User from "../models/User";
import UserSettings from "../models/UserSettings";
import { ISeller, IUser, IUserSettings } from "../types";

import { env } from "../utils/env";
import logger from "../config/loggingConfig";
import mongoose from "mongoose";

// Fetch all sellers or within a specific radius from a given origin
export const getAllSellers = async (origin?: { lat: number; lng: number }, radius?: number): Promise<ISeller[]> => {
  try {
    let sellers;
    if (origin && radius) {
      sellers = await Seller.find({
        sell_map_center: {
          $geoWithin: {
            $centerSphere: [[origin.lng, origin.lat], radius / 6378.1] // Radius in radians
          }
        }
      }).exec();
    } else {
      sellers = await Seller.find().exec();
    }
    return sellers;
  } catch (error: any) {
    logger.error(`Error retrieving sellers: ${error.message}`);
    throw new Error(error.message);
  }
};

export const getSellers = async (search_query: string): Promise<ISeller[] | null> => {
  try {
    const searchCriteria = search_query
      ? {
          $or: [
            { name: { $regex: search_query, $options: 'i' } },
            { description: { $regex: search_query, $options: 'i' } },
            { sale_items: { $regex: search_query, $options: 'i' } },
          ],
        }
      : {};

      const sellers = await Seller.find(searchCriteria).exec();
      return sellers.length ? sellers : null; 
  } catch (error: any) {
    logger.error(`Error retrieving sellers matching search query "${search_query}": ${error.message}`);
    throw new Error(error.message);
  }
};

// Fetch a single seller by ID
export const getSingleSellerById = async (seller_id: string): Promise<ISeller | null> => {
  try {
    const [seller, userSettings, user] = await Promise.all([
      Seller.findOne({ seller_id }).exec(),
      UserSettings.findOne({ user_settings_id: seller_id }).exec(),
      User.findOne({ pi_uid: seller_id }).exec()
    ]);

    if (!seller && !userSettings && !user) {
      return null;
    }

    return {
      sellerShopInfo: seller as ISeller,
      sellerSettings: userSettings as IUserSettings,
      sellerInfo: user as IUser,
    } as any;
  } catch (error: any) {
    logger.error(`Error retrieving seller with sellerID ${seller_id}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const registerOrUpdateSeller = async (authUser: IUser, formData: any, image: string): Promise<ISeller> => {
  try {
    const existingSeller = await Seller.findOne({ seller_id: authUser.pi_uid }).exec();

    // parse sell_map_center from String into JSON object.
    const sellMapCenter = formData.sell_map_center 
      ? JSON.parse(formData.sell_map_center)
      : { type: 'Point', coordinates: [0, 0] };
    
    // construct seller object
    const sellerData: Partial<ISeller> = {
      seller_id: authUser.pi_uid,
      name: formData.name || existingSeller?.name || authUser.user_name,
      description: formData.description || existingSeller?.description || '',
      seller_type: formData.seller_type || existingSeller?.seller_type || '',
      image: image || existingSeller?.image || env.CLOUDINARY_PLACEHOLDER_URL,
      address: formData.address || existingSeller?.address || '',
      sale_items: formData.sale_items || existingSeller?.sale_items || '',
      sell_map_center: sellMapCenter || existingSeller?.sell_map_center || { type: 'Point', coordinates: [0, 0] },
      order_online_enabled_pref: formData.order_online_enabled_pref || existingSeller?.order_online_enabled_pref || ''
    };

    if (existingSeller) {
      const updatedSeller = await Seller.findOneAndUpdate(
        { seller_id: authUser.pi_uid },
        { $set: sellerData },
        { new: true }
      ).exec();
      return updatedSeller as ISeller;
    } else {
      sellerData.trust_meter_rating = 100;
      sellerData.average_rating = mongoose.Types.Decimal128.fromString('5.0');

      const newSeller = new Seller(sellerData);
      const savedSeller = await newSeller.save();
      return savedSeller as ISeller;
    }
  } catch (error: any) {
    logger.error(`Error registering seller: ${error.message}`);
    throw new Error(error.message);
  }
};

// Delete existing seller
export const deleteSeller = async (seller_id: string): Promise<ISeller | null> => {
  try {
    const deletedSeller = await Seller.findOneAndDelete({ seller_id }).exec();
    return deletedSeller ? deletedSeller as ISeller : null;
  } catch (error: any) {
    logger.error(`Error deleting seller with sellerID ${seller_id}: ${error.message}`);
    throw new Error(error.message);
  }
};
