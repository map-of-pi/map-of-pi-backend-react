import Seller from "../models/Seller";
import { ISeller } from "../types";

export const getAllSellers = async (): Promise<ISeller[]> => {
  try {
    const sellers = await Seller.find();
    return sellers;
  } catch (error: any) {
    console.log("Error retrieving all sellers", error.message);
    throw new Error(error.message);
  }
};

export const getSingleSellerById = async (seller_id: string): Promise<ISeller | null> => {
  try {
    const seller = await Seller.findOne({seller_id});
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
