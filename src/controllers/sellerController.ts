import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";
import { ISeller } from "../types";

export const getAllSellers = async (req: Request, res: Response) => {
  try {
    // Extracting origin and radius from query parameters
    const { origin, radius } = req.query;

    // Parsing the origin to an object and radius to a float, with default radius of 10 if not provided
    const parsedOrigin = JSON.parse(origin as string);
    const parsedRadius = parseFloat(radius as string) || 10;

    // Logging the received parameters for debugging purposes
    console.log('Received origin:', parsedOrigin);
    console.log('Received radius:', parsedRadius);

    // Fetching sellers based on the provided origin and radius
    const sellers = await sellerService.getAllSellers(parsedOrigin, parsedRadius);
    return res.status(200).json(sellers);
  } catch (error: any) {
    console.error('Error fetching sellers:', error.message);
    res.status(500).json({ message: error.message });
  }
};

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

export const registerNewSeller = async (req: Request, res: Response) => {
  try {
    const sellerData = req.body;
    const newSeller = await sellerService.registerNewSeller(sellerData);
    return res.status(200).json({ newSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;
    const sellerData = req.body;
    const updatedSeller = await sellerService.updateSeller(seller_id, sellerData);
    return res.status(200).json({ updatedSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
