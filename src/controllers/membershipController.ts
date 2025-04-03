import { Request, Response } from "express";
import * as membershipService from "../services/membership.service";
import logger from "../config/loggingConfig";
import { MembershipClassType } from "../models/enums/membershipClassType";

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

// Controller to add or update a user's membership
export const manageMembership = async (req: Request, res: Response) => {
  const authUser = req.currentUser;

  // Early return if request is not authenticated
  if (!authUser) {
    logger.warn('Unauthorized attempt to manage membership.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { membership_class, membership_duration, mappi_allowance } = req.body;

  // Basic input validation
  if (
    !membership_class || 
    !Object.values(MembershipClassType).includes(membership_class) || // Ensure membership_class is valid
    typeof membership_duration !== 'number' ||
    typeof mappi_allowance !== 'number'                               
  ) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  try {
    // Add or update membership in the service layer
    const updatedMembership = await membershipService.addOrUpdateMembership(
      authUser,
      membership_class,
      membership_duration,
      mappi_allowance
    );

    logger.info(`Membership managed successfully for user ${authUser.pi_uid}`);
    return res.status(200).json(updatedMembership);
  } catch (error) {
    logger.error(`Failed to manage membership for user ${authUser.pi_uid}:`, error);
    return res.status(500).json({
      message: 'An error occurred while getting single membership; please try again later',
    });
  }
};
