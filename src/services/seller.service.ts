import Seller from "../models/Seller";
import User from "../models/User";
import UserSettings from "../models/UserSettings";
import { VisibleSellerType } from '../models/enums/sellerType';
import { getUserSettingsById } from "./userSettings.service";
import { ISeller, IUser, IUserSettings, ISellerWithSettings } from "../types";

import logger from "../config/loggingConfig";
import { TrustMeterScale } from "../models/enums/trustMeterScale";

// Helper function to get settings for all sellers and merge them into seller objects
const resolveSellerSettings = async (sellers: ISeller[]): Promise<ISellerWithSettings[]> => {
  const sellersWithSettings = await Promise.all(
    sellers.map(async (seller) => {
      try {
        const sellerObject = seller.toObject();

        // Fetch the user settings for the seller
        const userSettings = await getUserSettingsById(seller.seller_id);
        
        // Merge seller and settings into a single object
        return {
          ...sellerObject,
          trust_meter_rating: userSettings?.trust_meter_rating,
          user_name: userSettings?.user_name,
          findme: userSettings?.findme,
          email: userSettings?.email ?? null,
          phone_number: userSettings?.phone_number ?? null, 
        } as ISellerWithSettings;
      } catch (error) {
        logger.error(`Failed to resolve settings for sellerID ${ seller.seller_id }:`, error);
        
        // Return a fallback seller object with minimal information
        return {
          ...seller.toObject(),
          trust_meter_rating: TrustMeterScale.ZERO,
          user_name: seller.name,
          findme: null,
          email: null,
          phone_number: null
        } as unknown as ISellerWithSettings;
      }
    })
  );
  return sellersWithSettings;
};

// Fetch all sellers or within a specific bounding box; optional search query.
export const getAllSellers = async (
  bounds?: { sw_lat: number, sw_lng: number, ne_lat: number, ne_lng: number },
  search_query?: string
): Promise<ISellerWithSettings[]> => {
  try {
    let sellers: ISeller[];
    const maxNumSellers = 36;

    // always apply this condition to exclude 'Inactive sellers'
    const baseCriteria = { seller_type: { $in: Object.values(VisibleSellerType) } };
    
    // if search_query is provided, add search conditions
    const searchCriteria = search_query
      ? {
          $or: [
            { name: { $regex: search_query, $options: 'i' } },
            { description: { $regex: search_query, $options: 'i' } }
          ],
        }
      : {};

    // Merge base criteria with search criteria
    const aggregatedCriteria = { ...baseCriteria, ...searchCriteria };

    // If bounds are provided, use MongoDB's $geometry operator
    if (bounds) {
      sellers = await Seller.find({
        ...aggregatedCriteria,
        sell_map_center: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [ [
                [bounds.sw_lng, bounds.sw_lat],
                [bounds.ne_lng, bounds.sw_lat],
                [bounds.ne_lng, bounds.ne_lat],
                [bounds.sw_lng, bounds.ne_lat],
                [bounds.sw_lng, bounds.sw_lat]
              ] ]
            }
          }
        }
      })
      .sort({ updatedAt: -1 }) // Sort by last updated
      .limit(maxNumSellers)
      .exec();
    } else {
      // If no bounds are provided, return all sellers (without geo-filtering)  
      sellers = await Seller.find(aggregatedCriteria)
        .sort({ updated_at: -1 })
        .limit(maxNumSellers)
        .exec();
    }

    // Fetch and merge the settings for each seller
    const sellersWithSettings = await resolveSellerSettings(sellers);

    // Return sellers with their settings merged
    return sellersWithSettings;
  } catch (error) {
    logger.error('Failed to get all sellers:', error);
    throw new Error('Failed to get all sellers; please try again later');
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
  } catch (error) {
    logger.error(`Failed to get single seller for sellerID ${ seller_id }:`, error);
    throw new Error('Failed to get single seller; please try again later');
  }
};

export const registerOrUpdateSeller = async (authUser: IUser, formData: any, image: string): Promise<ISeller> => {
  try {
    const existingSeller = await Seller.findOne({ seller_id: authUser.pi_uid }).exec();

    // Parse and validate sell_map_center from formData
    const sellMapCenter = (formData.sell_map_center && formData.sell_map_center !== 'undefined') 
      ? JSON.parse(formData.sell_map_center)
      : existingSeller?.sell_map_center || { type: 'Point', coordinates: [0, 0] };

    // Construct seller object while merging with existing data if necessary
    const sellerData: Partial<ISeller> = {
      seller_id: authUser.pi_uid,
      name: formData.name || existingSeller?.name || authUser.user_name,
      description: formData.description || existingSeller?.description || '',
      seller_type: formData.seller_type || existingSeller?.seller_type || '',
      image: image || existingSeller?.image || '',
      address: formData.address || existingSeller?.address || '',
      sell_map_center: sellMapCenter,
      order_online_enabled_pref: formData.order_online_enabled_pref || existingSeller?.order_online_enabled_pref || ''
    };

    // Update existing seller or create a new one
    if (existingSeller) {
      const updatedSeller = await Seller.findOneAndUpdate(
        { seller_id: authUser.pi_uid },
        { $set: sellerData },
        { new: true }
      ).exec();
      logger.debug('Seller updated in the database:', updatedSeller);
      return updatedSeller as ISeller;
    } else {
      const shopName = sellerData.name || authUser.user_name;
      const newSeller = new Seller({
        ...sellerData,
        name: shopName,
        average_rating: 5.0,
        order_online_enabled_pref: false,
      });
      const savedSeller = await newSeller.save();
      logger.info('New seller created in the database:', savedSeller);
      return savedSeller as ISeller;
    }
  } catch (error) {
    logger.error('Failed to register or update seller:', error);
    throw new Error('Failed to register or update seller; please try again later');
  }
};

// Delete existing seller
export const deleteSeller = async (seller_id: string | undefined): Promise<ISeller | null> => {
  try {
    const deletedSeller = await Seller.findOneAndDelete({ seller_id }).exec();
    return deletedSeller ? deletedSeller as ISeller : null;
  } catch (error) {
    logger.error(`Failed to delete seller for sellerID ${ seller_id }:`, error);
    throw new Error('Failed to delete seller; please try again later');
  }
};
