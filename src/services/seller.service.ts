import Seller from "../models/Seller";
import { ISeller } from "../types";

// Fetch all sellers or within a specific radius from a given origin
export const getAllSellers = async (origin?: { lat: number; lng: number }, radius?: number): Promise<ISeller[]> => {
  try {
    let sellers;
    if (origin && radius) {
      sellers = await Seller.find({
        coordinates: {
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
    console.error("Error retrieving sellers:", error.message);
    throw new Error(error.message);
  }
};

// Fetch a single seller by ID
export const getSingleSellerById = async (seller_id: string): Promise<ISeller | null> => {
  try {
    const seller = await Seller.findOne({ seller_id }).exec();
    return seller ? seller as ISeller : null;
  } catch (error: any) {
    console.error(`Error retrieving seller with sellerID ${seller_id}:`, error.message);
    throw new Error(error.message);
  }
};

// Register a new seller
export const registerNewSeller = async (sellerData: ISeller): Promise<ISeller> => {
  try {
    const newSeller = new Seller(sellerData);
    const savedSeller = await newSeller.save();
    return savedSeller as ISeller;
  } catch (error: any) {
    console.error("Error registering new seller:", error.message);
    throw new Error(error.message);
  }
};

// Update an existing seller
export const updateSeller = async (seller_id: string, sellerData: Partial<ISeller>): Promise<ISeller | null> => {
  try {
    const updatedSeller = await Seller.findOneAndUpdate({ seller_id }, sellerData, { new: true }).exec();
    return updatedSeller ? updatedSeller as ISeller : null;
  } catch (error: any) {
    console.error(`Error updating seller for sellerID ${seller_id}: `, error.message);
    throw new Error(error.message);
  }
};
