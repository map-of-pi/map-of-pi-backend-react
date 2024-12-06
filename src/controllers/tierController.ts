import { Request, Response } from "express";
import { fetchAllTiers, fetchTierByClass } from "../services/tier.service";

export const getAllTiers = async (req: Request, res: Response) => {
  try {
    const tiers = await fetchAllTiers();
    res.status(200).json(tiers);
  } catch (error) {
    console.error("Error fetching tiers:", error);
    res.status(500).json({ message: "Failed to fetch tiers, please try again later." });
  }
};

export const getTierByClass = async (req: Request, res: Response) => {
  
  const { membershipClass } = req.params;
  console.log("Received membershipClass:", membershipClass);
  try {
    const tier = await fetchTierByClass(membershipClass);
    console.log("Fetched tier from database:", tier);
    if (!tier) {
      return res.status(404).json({ message: "Membership tier not found" });
    }
    res.status(200).json(tier);
  } catch (error) {
    console.error("Error fetching tier:", error);
    res.status(500).json({ message: "Failed to fetch tier, please try again later." });
  }
};
