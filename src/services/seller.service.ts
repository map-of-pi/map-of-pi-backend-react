import mongoose from 'mongoose';
import Seller from "../models/Seller";
import User from "../models/User";
import UserSettings from "../models/UserSettings";
import SellerItem from "../models/SellerItem";
import { FulfillmentType, VisibleSellerType } from '../models/enums/sellerType';
import { StockLevelType } from '../models/enums/stockLevelType';
import { TrustMeterScale } from "../models/enums/trustMeterScale";
import { getUserSettingsById } from "./userSettings.service";
import { IUser, IUserSettings, ISeller, ISellerWithSettings, ISellerItem, ISanctionedRegion } from "../types";

import logger from "../config/loggingConfig";

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
    const maxNumSellers = 50;

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
      .hint({ 'updatedAt': -1, 'sell_map_center.coordinates': '2dsphere' })
      .exec();
    } else {
      // If no bounds are provided, return all sellers (without geo-filtering)  
      sellers = await Seller.find(aggregatedCriteria)
        .sort({ updated_at: -1 })
        .limit(maxNumSellers)
        .hint({ 'updatedAt': -1, 'sell_map_center.coordinates': '2dsphere' })
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
    const [seller, userSettings, user, items] = await Promise.all([
      Seller.findOne({ seller_id }).exec(),
      UserSettings.findOne({ user_settings_id: seller_id }).exec(),
      User.findOne({ pi_uid: seller_id }).exec(),
      SellerItem.find({ seller_id: seller_id }).exec()
    ]);

    if (!seller && !userSettings && !user) {
      return null;
    }

    return {
      sellerShopInfo: seller as ISeller,
      sellerSettings: userSettings as IUserSettings,
      sellerInfo: user as IUser,
      sellerItems: items as ISellerItem[] || null
    } as any;
  } catch (error) {
    logger.error(`Failed to get single seller for sellerID ${ seller_id }:`, error);
    throw new Error('Failed to get single seller; please try again later');
  }
};

export const registerOrUpdateSeller = async (authUser: IUser, formData: any): Promise<ISeller> => {
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
      image: formData.image || existingSeller?.image || '',
      address: formData.address || existingSeller?.address || '',
      sell_map_center: sellMapCenter,
      order_online_enabled_pref: formData.order_online_enabled_pref || existingSeller?.order_online_enabled_pref || false,
      fulfillment_method: formData.fulfillment_method || existingSeller?.fulfillment_method || FulfillmentType.CollectionByBuyer,
      fulfillment_description: formData.fulfillment_description || existingSeller?.fulfillment_description || ''
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

export const getAllSellerItems = async (
  seller_id: string,
): Promise<ISellerItem[] | null> => {
  try {
    const existingItems = await SellerItem.find({
      seller_id: seller_id,
    });

    if (!existingItems || existingItems.length == 0) {
      logger.warn('Item list is empty.');
      return null;      
    } 
    logger.info('fetched item list successfully');
    return existingItems as ISellerItem[];
  } catch (error) {
    logger.error(`Failed to get seller items for sellerID ${ seller_id }:`, error);
    throw new Error('Failed to get seller items; please try again later');
  }
};

export const addOrUpdateSellerItem = async (
  seller: ISeller,
  item: ISellerItem
): Promise<ISellerItem | null> => {
  try {
    const today = new Date();

    // Ensure duration is valid (default to 1 week)
    const duration = Number(item.duration) || 1;
    const durationInMs = duration * 7 * 24 * 60 * 60 * 1000;
    const expiredBy = new Date(today.getTime() + durationInMs);

    // Define a unique query for finding existing items
    const query = {
      _id: item._id || undefined,
      seller_id: seller.seller_id,
    };

    // Attempt to find the existing item
    const existingItem = await SellerItem.findOne(query);

    if (existingItem) {
      // Update the existing item
      existingItem.set({
        ...item,
        expired_by: expiredBy,
        image: item.image || existingItem.image, // Use existing image if a new one isn't provided
      });
      const updatedItem = await existingItem.save();

      logger.info('Item updated successfully:', { updatedItem });
      return updatedItem;
    } else {
      // Create a new item with a unique ID
      const newItemId = item._id || new mongoose.Types.ObjectId().toString();

      // Create a new item
      const newItem = new SellerItem({
        _id: newItemId,
        seller_id: seller.seller_id,
        name: item.name ? item.name.trim() : '',
        description: item.description ? item.description.trim() : '',
        price: parseFloat(item.price?.toString() || '0.01'), // Ensure valid price
        stock_level: item.stock_level || StockLevelType.AVAILABLE_1,
        duration: parseInt(item.duration?.toString() || '1'), // Ensure valid duration
        image: item.image,
        expired_by: expiredBy,
      });

      await newItem.save();

      logger.info('Item created successfully:', { newItem });
      return newItem;
    }
  } catch (error) {
    logger.error(`Failed to add or update seller item for sellerID ${seller.seller_id}:`, error);
    throw new Error('Failed to add or update seller item; please try again later');
  }
};

// Delete existing seller item
export const deleteSellerItem = async (id: string): Promise<ISellerItem | null> => {
  try {
    const deletedSellerItem = await SellerItem.findByIdAndDelete(id).exec();
    return deletedSellerItem ? deletedSellerItem as ISellerItem : null;
  } catch (error) {
    logger.error(`Failed to delete seller item for itemID ${ id }:`, error);
    throw new Error('Failed to delete seller item; please try again later');
  }
};

export const getSellersWithinSanctionedRegion = async (region: ISanctionedRegion): Promise<ISeller[]> => {
  try {
    const sellers = await Seller.find({
      sell_map_center: {
        $geoWithin: {
          $geometry: region.boundary
        }
      }
    }).exec();
    logger.info(`Found ${sellers.length} seller(s) within the sanctioned region: ${region.location}`);
    return sellers;
  } catch (error) {
    logger.error(`Failed to get sellers within sanctioned region ${ region }:`, error);
    throw new Error(`Failed to get sellers within sanctioned region ${ region }; please try again later`);  
  }
};