import { Request, Response } from "express";

import * as sellerService from "../services/seller.service";
import { ISeller } from "../types";

export const getAllSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await sellerService.getAllSellers();
    return res.status(200).json(sellers);
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

export const updateSeller = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
