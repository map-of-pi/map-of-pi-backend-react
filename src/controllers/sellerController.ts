import { Request, Response } from "express";

import * as sellerService from "../services/seller.service";
import { ISeller } from "../types";

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

export const fetchSellerRegistration = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser || !req.currentSeller) {
      return res.status(404).json({ message: "Seller registration not found." });
    }
    const currentSeller = req.currentSeller;
    res.status(200).json(currentSeller);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerSeller = async (req: Request, res: Response) => {
  try {
    const authUser = req.currentUser;
    if (authUser){
      const seller = JSON.parse(req.body.json);
      const registeredSeller = await sellerService.registerOrUpdateSeller(seller, authUser);
      return res.status(200).json({ seller: registeredSeller });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;
    const deletedSeller = await sellerService.deleteSeller(seller_id);
    res.status(200).json({ message: "Seller deleted successfully.", deletedSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;
    const sellerData: Partial<ISeller> = req.body;
    const updatedSeller = await sellerService.updateSeller(seller_id, sellerData);
    return res.status(200).json({ updatedSeller });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
