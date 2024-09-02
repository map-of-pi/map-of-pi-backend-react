import Seller from "../models/Seller";
import { ISeller, IUser, IUserSettings } from "../types";
import logger from "../config/loggingConfig";
import User from "../models/User";
import UserSettings from "../models/UserSettings";

interface SearchCriteria {
  name?: string;
  category?: string;
  origin?: {
    lat: number;
    lng: number;
  };
  radius?: number;
}

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

// Fetch sellers by search criteria
export const getSellersByCriteria = async (searchCriteria: SearchCriteria): Promise<ISeller[]> => {
  try {
    const query: any = {};

    // Filter by name
    if (searchCriteria.name) {
      query.name = { $regex: searchCriteria.name, $options: 'i' };
    }

    // Filter by category
    if (searchCriteria.category) {
      query.category = searchCriteria.category;
    }

    // Filter by location and radius
    if (searchCriteria.origin && typeof searchCriteria.radius === 'number') {
      const { lat, lng } = searchCriteria.origin;
      const radiusInRadians = searchCriteria.radius / 6378.1; // Convert radius to radians
      query.sell_map_center = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      };
    }

    const sellers = await Seller.find(query).exec();
    return sellers;
  } catch (error: any) {
    logger.error(`Error retrieving sellers with criteria: ${JSON.stringify(searchCriteria)} - ${error.message}`);
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
