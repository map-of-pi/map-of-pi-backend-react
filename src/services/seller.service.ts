import Seller from "../models/Seller";
import User from "../models/User";
import UserSettings from "../models/UserSettings";
import { ISeller, IUser, IUserSettings } from "../types";

import logger from "../config/loggingConfig";

// Fetch all sellers or within a specific radius from a given origin; optional search query.
export const getAllSellers = async (
  origin?: { lat: number; lng: number },
  radius?: number,
  search_query?: string
): Promise<ISeller[]> => {
  try {
    let sellers;

    // always apply this condition to exclude 'CurrentlyNotSelling' sellers
    const baseCriteria = { seller_type: { $ne: 'CurrentlyNotSelling' } };

    // if search_query is provided, add search conditions
    const searchCriteria = search_query
      ? {
          $or: [
            { name: { $regex: search_query, $options: 'i' } },
            { description: { $regex: search_query, $options: 'i' } },
            { sale_items: { $regex: search_query, $options: 'i' } },
          ],
        }
      : {};

    // merge criterias
    const aggregatedCriteria = { ...baseCriteria, ...searchCriteria };

    // conditional to apply geospatial filtering
    if (origin && radius) {
      sellers = await Seller.find({
        ...aggregatedCriteria,
        sell_map_center: {
          $geoWithin: {
            $centerSphere: [[origin.lng, origin.lat], radius / 6378.1] // Radius in radians
          }
        }
      }).exec();
    } else {
      sellers = await Seller.find(aggregatedCriteria).exec();
    }

    return sellers;
  } catch (error: any) {
    logger.error(`Error retrieving sellers: ${error.message}`);
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

export const registerOrUpdateSeller = async (sellerData: ISeller, authUser: IUser): Promise<ISeller> => {
  try {
    let seller = await Seller.findOne({ seller_id: authUser.pi_uid }).exec();

    if (seller) {
      const updatedSeller = await Seller.findOneAndUpdate(
        { seller_id: authUser.pi_uid }, 
        sellerData, { new: true }
      );
      return updatedSeller as ISeller;
    } else {
      const shopName = !sellerData.name ? authUser.user_name : sellerData.name;
      const newSeller = new Seller({
        ...sellerData,
        seller_id: authUser.pi_uid,
        name: shopName,
        trust_meter_rating: 100,
        average_rating: 5.0,
        order_online_enabled_pref: false,
      });
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
