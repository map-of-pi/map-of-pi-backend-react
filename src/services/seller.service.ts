import Seller from "../models/Seller";
import { ISeller } from "../types";

// Fetch all sellers or within a specific radius from a given origin
export const getAllSellers = async (origin?: { lat: number; lng: number }, radius?: number): Promise<ISeller[]> => {
  try {
    let sellers;
    if (origin && radius) {
<<<<<<< Updated upstream
      sellers = await Seller.find({
=======
<<<<<<< Updated upstream
      // If origin and radius are provided, filter sellers based on the geographic location within the given radius
      const sellers = await Seller.find({
=======
      console.log('Fetching sellers within radius:', radius, 'from origin:', origin);
      sellers = await Seller.find({
>>>>>>> Stashed changes
>>>>>>> Stashed changes
        coordinates: {
          $geoWithin: {
            $centerSphere: [[origin.lng, origin.lat], radius / 6378.1] // Radius in radians
          }
        }
<<<<<<< Updated upstream
      }).exec();
    } else {
      sellers = await Seller.find().exec();
=======
<<<<<<< Updated upstream
      });
      return sellers;
    } else {
      // If no origin and radius, return all sellers
      const sellers = await Seller.find();
      return sellers;
=======
      }).exec();
      console.log('Sellers fetched within radius:', sellers);
    } else {
      console.log('Fetching all sellers');
      sellers = await Seller.find().exec();
      console.log('All sellers fetched:', sellers);
>>>>>>> Stashed changes
>>>>>>> Stashed changes
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
    console.error(`Error retrieving seller with ID ${seller_id}:`, error.message);
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
    console.error("Error updating seller:", error.message);
    throw new Error(error.message);
  }
};
