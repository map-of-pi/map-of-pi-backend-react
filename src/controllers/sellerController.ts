import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";
import { uploadImage } from "../services/misc/image.service";
import { ISeller } from "../types";

import { env } from "../utils/env";
import logger from "../config/loggingConfig";

export const fetchSellersByLocation = async (req: Request, res: Response) => {
  try {
    const { origin, radius } = req.body;
    const sellers = await sellerService.getAllSellers(origin, radius);
    if (!sellers || sellers.length === 0) {
      logger.warn(`No sellers found within ${radius}km of ${origin}`);
      return res.status(404).json({ message: "Sellers not found" });
    }
    logger.info(`Fetched ${sellers.length} sellers within ${radius}km of ${origin}`);
    res.status(200).json(sellers);
  } catch (error: any) {
    logger.error(`Failed to fetch sellers by location: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getSellers = async (req: Request, res: Response) => {
  const { search_query = '' } = req.params; // default to empty string if not provided
  try {
    const sellers = await sellerService.getSellers(search_query);
    res.status(200).json(sellers);
  } catch (error: any) {
    logger.error(`Failed to get sellers with search query "${search_query}": ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getSingleSeller = async (req: Request, res: Response) => {
  const { seller_id } = req.params;
  try {
    const currentSeller = await sellerService.getSingleSellerById(seller_id);
    if (!currentSeller) {
      logger.warn(`Seller with ID ${seller_id} not found.`);
      return res.status(404).json({ message: "Seller not found" });
    }
    logger.info(`Fetched seller with ID ${seller_id}`);
    res.status(200).json(currentSeller);
  } catch (error: any) {
    logger.error(`Failed to get seller with ID ${seller_id}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const fetchSellerRegistration = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser || !req.currentSeller) {
      logger.warn(`Seller registration not found for user ${req.currentUser?.pi_uid || "NULL"}`);
      return res.status(404).json({ message: "Seller registration not found" });
    }
    const currentSeller = req.currentSeller;
    logger.info(`Fetched seller registration for user ${req.currentUser.pi_uid}`);
    res.status(200).json(currentSeller);
  } catch (error: any) {
    logger.error(`Failed to fetch seller registration: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const registerSeller = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;

    if (!authUser) {
      logger.warn("No authenticated user found for registering.");
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // file handling
    const file = req.file;
    const image = file ? await uploadImage(file, 'seller-registration') : '';
    const formData = req.body;

    const sellMapCenter = formData.sell_map_center ? JSON.parse(formData.sell_map_center) : { type: 'Point', coordinates: [0, 0] };

    // fetch existing seller data
    const existingSeller = authUser.pi_uid ? await sellerService.getSingleSellerById(authUser.pi_uid) : null;

    // construct seller object
    const seller: Partial<ISeller> = {
      ...existingSeller,
      name: formData.name || existingSeller?.name || '',
      seller_type: formData.seller_type || existingSeller?.seller_type || '',
      description: formData.description || existingSeller?.description || '',
      address: formData.address || existingSeller?.address || '',
      sale_items: formData.sale_items || existingSeller?.sale_items || '',
      image: image || existingSeller?.image || env.CLOUDINARY_PLACEHOLDER_URL,
      sell_map_center: sellMapCenter || existingSeller?.sell_map_center || { type: 'Point', coordinates: [0, 0] }
    };

    const registeredSeller = await sellerService.registerOrUpdateSeller(seller, authUser);
    logger.info(`Registered or updated seller for user ${authUser.pi_uid}`);
    return res.status(200).json({ seller: registeredSeller });
  } catch (error: any) {
    logger.error(`Failed to register seller: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  const { seller_id } = req.params;
  try {
    const deletedSeller = await sellerService.deleteSeller(seller_id);
    logger.info(`Deleted seller with ID ${seller_id}`);
    res.status(200).json({ message: "Seller deleted successfully", deletedSeller });
  } catch (error: any) {
    logger.error(`Failed to delete seller with ID ${seller_id}: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
