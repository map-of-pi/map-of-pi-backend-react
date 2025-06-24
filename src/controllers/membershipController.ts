import { Request, Response } from "express";
import * as membershipService from "../services/membership.service";
import logger from "../config/loggingConfig";

// Controller to fetch a single membership by its ID
export const getSingleMembership = async (req: Request, res: Response) => {
  const { membership_id } = req.params;

  try {
    const currentMembership = await membershipService.getSingleMembershipById(membership_id);

    if (!currentMembership) {
      logger.warn(`Membership with ID ${membership_id} not found.`);
      return res.status(404).json({ message: "Membership not found" });
    }

    logger.info(`Fetched membership with ID ${membership_id}`);
    return res.status(200).json(currentMembership);
  } catch (error) {
    logger.error(`Error getting membership ID ${membership_id}:`, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership; please try again later' });
  }
};
