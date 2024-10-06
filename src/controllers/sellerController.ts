import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";
import { uploadImage } from "../services/misc/image.service";

import logger from "../config/loggingConfig";
import { ISeller } from "../types";

export const fetchSellersByCriteria = async (req: Request, res: Response) => {
  try {
    const { origin, radius, search_query } = req.body;
    const sellers = await sellerService.getAllSellers(origin, radius, search_query);
    const originString = origin ? `(${origin.lat}, ${origin.lng})` : 'undefined';

    if (!sellers || sellers.length === 0) {
      logger.warn(`No sellers found within ${radius ?? 'undefined'} km of ${originString} with "${search_query ?? 'undefined'}"`);
      return res.status(204).json({ message: "Sellers not found" });
    }
    logger.info(`Fetched ${sellers.length} sellers within ${radius ?? 'undefined'} km of ${originString} with "${search_query ?? 'undefined'}"`);
    res.status(200).json(sellers);
  } catch (error: any) {
    logger.error('Failed to fetch sellers by criteria:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while fetching sellers; please try again later' });
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
    logger.error(`Failed to get single seller for sellerID ${ seller_id }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while getting single seller; please try again later' });
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
    logger.error('Failed to fetch seller registration:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while fetching seller registration; please try again later' });
  }
};

export const registerSeller = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    const formData = req.body as ISeller;

    if (!authUser) {
      logger.warn("No authenticated user found for registering.");
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // image file handling
    const file = req.file;
    const image = file ? await uploadImage(authUser.pi_uid, file, 'seller-registration') : '';

    formData.image = image;
    
    const registeredSeller = await sellerService.registerOrUpdateSeller(authUser, formData, image);
    logger.info(`Registered or updated seller for user ${authUser.pi_uid}`);
    return res.status(200).json({ seller: registeredSeller });
  } catch (error: any) {
    logger.error(`Failed to register seller for userID ${ req?.currentUser?.pi_uid }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while registering seller; please try again later' });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    const deletedSeller = await sellerService.deleteSeller(authUser?.pi_uid);
    logger.info(`Deleted seller with ID ${authUser?.pi_uid}`);
    res.status(200).json({ message: "Seller deleted successfully", deletedSeller });
  } catch (error: any) {
    logger.error(`Failed to delete seller for userID ${ req.currentUser?.pi_uid }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return res.status(500).json({ message: 'An error occurred while deleting seller; please try again later' });
  }
};
