import { Request, Response } from "express";
import * as membershipService from "../services/membership.service";
import logger from "../config/loggingConfig";
import { IUser } from "../types"

export const fetchMembershipList = async (req: Request, res: Response) => {
  try {
    const membershipList = await membershipService.buildMembershipList();

    if (!membershipList) {
      logger.warn(`No membership list found.`);
      return res.status(404).json({ message: "Membership list not found" });
    }

    logger.info(`Fetched membership list`);
    return res.status(200).json(membershipList);
    
  } catch (error) {
    logger.error(`Error getting membership list: `, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership list; please try again later' });
  }
}; 

export const fetchUserMembership = async (req: Request, res: Response) => {
  const authUser = req.currentUser as IUser;

  try {
    const currentMembership = await membershipService.getUserMembership(authUser);

    if (!currentMembership) {
      logger.warn(`Membership with ID ${authUser.pi_uid} not found.`);
      return res.status(404).json({ message: "Membership not found" });
    }

    logger.info(`Fetched membership with ID ${authUser.pi_uid}`);
    return res.status(200).json(currentMembership);
  } catch (error) {
    logger.error(`Error getting membership ID ${authUser.pi_uid}:`, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership; please try again later' });
  }
};


// Controller to fetch a single membership by its ID 
export const getSingleMembership = async (req: Request, res: Response) => {
  const { membership_id } = req.params;

  try {
    const membership = await membershipService.getSingleMembershipById(membership_id);

    if (!membership) {
      logger.warn(`Membership with ID ${membership_id} not found.`);
      return res.status(404).json({ message: "Membership not found" });
    }

    logger.info(`Fetched membership with ID ${membership_id}`);
    return res.status(200).json(membership);
  } catch (error) {
    logger.error(`Error getting membership ID ${membership_id}:`, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership; please try again later' });
  }
};

export const updateOrRenewMembership = async (req: Request, res: Response) => { 
  try {
    const { membership_class } = req.body;
    const authUser = req.currentUser

    if (!authUser) return res.status(401).json({ error: "Unauthorized - user not authenticated "});

    const updated = await membershipService.updateOrRenewMembership(authUser.pi_uid, membership_class);

    return res.status(200).json(updated);
  } catch (error: any) {
    logger.error("Failed to update or renew membership:", error);
    return res.status(400).json({ error: error.message });
  }
};