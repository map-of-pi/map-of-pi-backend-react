import Seller from "../models/Seller";
import { ISeller } from "../types";

export const getAllSellers = async (
  origin?: { lat: number; lng: number },
  radius?: number
): Promise<ISeller[]> => {
  try {
    if (origin && radius) {
      // If origin and radius are provided, filter sellers based on the geographic location within the given radius
      const sellers = await Seller.find({
        coordinates: {
          $geoWithin: {
            $centerSphere: [[origin.lng, origin.lat], radius / 6378.1] // Radius in radians
          }
        }
      });
      return sellers;
    } else {
      // If no origin and radius, return all sellers
      const sellers = await Seller.find();
      return sellers;
    }
  } catch (error: any) {
    console.log("Error retrieving sellers", error.message);
    throw new Error(error.message);
  }
};

export const getSingleSellerById = async (seller_id: string): Promise<ISeller | null> => {
  try {
    const seller = await Seller.findOne({ seller_id });
    return seller;
  } catch (error: any) {
    console.error(`Error retrieving seller with ID ${seller_id}:`, error.message);
    throw new Error(error.message);
  }
};

export const registerNewSeller = async (sellerData: ISeller): Promise<ISeller> => {
  try {
    const newSeller = new Seller(sellerData);
    const savedSeller = await newSeller.save();
    return savedSeller;
  } catch (error: any) {
    console.log("Error registering new seller", error.message);
    throw new Error(error.message);
  }
};

export const updateSeller = async (seller_id: string, sellerData: Partial<ISeller>): Promise<ISeller | null> => {
  try {
    const updatedSeller = await Seller.findOneAndUpdate({ seller_id }, sellerData, { new: true });
    return updatedSeller;
  } catch (error: any) {
    console.log("Error updating seller", error.message);
    throw new Error(error.message);
  }
};
