import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";
import { ISeller } from "../types";

/**
 * Fetch sellers by location
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const fetchSellersByLocation = async (req: Request, res: Response) => {
  try {
    const { origin, radius } = req.body;
    const sellers = await sellerService.getAllSellers(origin, radius);
    if (!sellers) {
      return res.status(404).json({ message: "Sellers not found." });
    }
    res.status(200).json(sellers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single seller by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getSingleSeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;
    const currentSeller: ISeller | null = await sellerService.getSingleSellerById(seller_id);
    if (!currentSeller) {
      return res.status(404).json({ message: "Seller not found." });
    }
    res.status(200).json(currentSeller);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Register a new seller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const registerNewSeller = async (req: Request, res: Response) => {
  try {
    const sellerData: ISeller = req.body; // Ensure sellerData matches ISeller interface
    const newSeller = await sellerService.registerNewSeller(sellerData);
    return res.status(200).json({ newSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing seller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateSeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;
    const sellerData: Partial<ISeller> = req.body; // Ensure sellerData matches ISeller interface
    const updatedSeller = await sellerService.updateSeller(seller_id, sellerData);
    return res.status(200).json({ updatedSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
