import Seller from "../models/Seller";
import User from "../models/User";
import { getUserSettingsById } from "./userSettings.service";
import { ISeller, IUser, IUserSettings, ISellerWithSettings } from "../types";
import UserSettings from "../models/UserSettings";
import { SellerType } from '../models/enums/sellerType'

import logger from "../config/loggingConfig";

// Helper function to get settings for all sellers and merge them into seller objects
const resolveSellerSettings = async (sellers: ISeller[]): Promise<ISellerWithSettings[]> => {
  const sellersWithSettings = await Promise.all(
    sellers.map(async (seller) => {
      const sellerObject = seller.toObject();

      // Fetch the user settings for the seller
      const userSettings = await getUserSettingsById(seller.seller_id);
      
      // Merge seller and settings into a single object
      return {
        ...sellerObject,
        trust_meter_rating: userSettings?.trust_meter_rating,
        user_name: userSettings?.user_name,
        findme: userSettings?.findme,
        email: userSettings?.email,
        phone_number: userSettings?.phone_number
      } as ISellerWithSettings;
    })
  );
  return sellersWithSettings;
};

// Fetch all sellers or within a specific radius from a given origin; optional search query.
export const getAllSellers = async (
  origin?: { lat: number; lng: number },
  radius?: number,
  search_query?: string
): Promise<ISellerWithSettings[]> => {
  try {
    let sellers: ISeller[];

    // always apply this condition to exclude 'Inactive sellers'
    const baseCriteria = { seller_type: { $ne: SellerType.Inactive } };
    
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

    // Fetch and merge the settings for each seller
    const sellersWithSettings = await resolveSellerSettings(sellers);

    // Return sellers with their settings merged
    return sellersWithSettings;
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
      image: image || existingSeller?.image || '',
      address: formData.address || existingSeller?.address || '',
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
      const shopName = !sellerData.name ? authUser.user_name : sellerData.name;
      const newSeller = new Seller({
        ...sellerData,
        seller_id: authUser.pi_uid,
        name: shopName,
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
