import { Request, Response } from "express";

import * as sellerService from "../services/seller.service";
import { uploadImage } from "../services/misc/image.service";

import { env } from "../utils/env";
import logger from "../config/loggingConfig";

export const fetchSellersByLocation = async (req: Request, res: Response) => {
  try {
    const { origin, radius } = req.body;
    const sellers = await sellerService.getAllSellers(origin, radius);
    if (!sellers) {
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

    const seller = JSON.parse(req.body.json);

    // handle single image upload and set placeholder if no image is uploaded
    seller.image = req.file ? await uploadImage(req.file, 'seller-registration') : env.CLOUDINARY_PLACEHOLDER_URL;

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
