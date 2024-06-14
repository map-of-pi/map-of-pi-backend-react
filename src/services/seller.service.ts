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
