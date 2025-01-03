import Tier from "../models/Tiers";
import logger from "../config/loggingConfig";

// Fetch all tiers sorted by priority level
export const fetchAllTiers = async () => {
  try {
    return await Tier.find().sort({ priorityLevel: 1 }).exec();
  } catch (error) {
    logger.error("Error fetching all tiers:", error);
    throw new Error("Failed to fetch tiers");
  }
};

// Fetch a specific tier by its membership class
export const fetchTierByClass = async (membershipClass: string) => {
  try {
    return await Tier.findOne({ class: membershipClass }).exec();
  } catch (error) {
    logger.error(`Error fetching tier for class ${membershipClass}:`, error);
    throw new Error(`Failed to fetch tier for class: ${membershipClass}`);
  }
};
