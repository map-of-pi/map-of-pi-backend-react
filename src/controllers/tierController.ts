import { Request, Response } from "express";
import { fetchAllTiers, fetchTierByClass } from "../services/tier.service";
import logger from "../config/loggingConfig";

export const getAllTiers = async (req: Request, res: Response) => {
  try {
    const tiers = await fetchAllTiers();
    res.status(200).json(tiers);
  } catch (error) {
    logger.error("Error fetching tiers:", error);
    res.status(500).json({ message: "Failed to fetch tiers, please try again later." });
  }
};

export const getTierByClass = async (req: Request, res: Response) => {
  const { membershipClass } = req.params;

  if (!membershipClass) {
    return res.status(400).json({ message: "Membership class is required" });
  }

  try {
    const tier = await fetchTierByClass(membershipClass);

    if (!tier) {
      return res.status(404).json({ message: "Membership tier not found" });
    }

    res.status(200).json(tier);
  } catch (error) {
    logger.error(`Error fetching tier for membershipClass: ${membershipClass}`, error);
    res.status(500).json({ message: "Failed to fetch tier, please try again later." });
  }
};
