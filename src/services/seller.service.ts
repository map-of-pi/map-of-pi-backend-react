import Seller from "../models/Seller";
import { ISeller } from "../types";
import { Document } from "mongoose";

// Define the type returned by mongoose find methods, which includes mongoose document properties
type SellerDocument = ISeller & Document;

// Fetch all sellers or within a specific radius from a given origin
export const getAllSellers = async (
  origin?: { lat: number; lng: number },
  radius?: number
): Promise<SellerDocument[]> => {
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
export const getSingleSellerById = async (seller_id: string): Promise<SellerDocument | null> => {
  try {
    const seller = await Seller.findOne({ seller_id }).exec();
    return seller as SellerDocument | null;
  } catch (error: any) {
    console.error(`Error retrieving seller with ID ${seller_id}:`, error.message);
    throw new Error(error.message);
  }
};

// Register a new seller
export const registerNewSeller = async (sellerData: ISeller): Promise<SellerDocument> => {
  try {
    const newSeller = new Seller(sellerData);
    const savedSeller = await newSeller.save();
    return savedSeller as SellerDocument;
  } catch (error: any) {
    console.error("Error registering new seller:", error.message);
    throw new Error(error.message);
  }
};

// Update an existing seller
export const updateSeller = async (seller_id: string, sellerData: Partial<ISeller>): Promise<SellerDocument | null> => {
  try {
    const updatedSeller = await Seller.findOneAndUpdate({ seller_id }, sellerData, { new: true }).exec();
    return updatedSeller as SellerDocument | null;
  } catch (error: any) {
    console.error("Error updating seller:", error.message);
    throw new Error(error.message);
  }
};
