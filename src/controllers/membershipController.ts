import { Request, Response } from "express";
import * as membershipService from "../services/membership.service";
import logger from "../config/loggingConfig";

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
    logger.error(`Failed to get single membership for membershipID ${ membership_id }:`, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership; please try again later' });
  }
};

export const manageMembership = async (req: Request, res: Response) => {
  const authUser = req.currentUser;
  try {
    // early authentication check
    if (!authUser) {
      logger.warn('No authenticated user found when trying to manage membership.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { membership_class, mappi_amount, duration } = req.body;
    const updatedMembership = await membershipService.addOrUpdateMembership(
      authUser,
      membership_class,
      mappi_amount,
      duration
    );
    logger.info(`Successfully managed membership for user ${authUser.pi_uid}`);
    return res.status(200).json({ membership: updatedMembership });
  } catch (error) {
    logger.error(`Failed to manage membership for userID ${authUser?.pi_uid}:`, error);
    return res.status(500).json({
      message: 'An error occurred while managing membership; please try again later',
    });
  }
};