import { Request, Response } from "express";
import * as membershipService from "../services/membership.service";
import logger from "../config/loggingConfig";
import { IUser } from "../types";

// Controller to fetch a single membership by its ID
export const getUserMembership = async (req: Request, res: Response) => {

  logger.info("enter membership controller")
  const authUser = req.currentUser as IUser; 

  try {
    const currentMembership = await membershipService.getUserMembership(authUser);

    if (!currentMembership) {
      logger.warn(`Membership with pioneer ID ${authUser.pi_uid} not found.`);
      return res.status(404).json({ message: "Membership not found" });
    }

    logger.info(`Fetched membership with pioneer ID ${authUser.pi_uid}`);
    return res.status(200).json(currentMembership);
  } catch (error) {
    logger.error(`Error getting membership ID ${authUser.pi_uid}:`, error);
    return res.status(500).json({ message: 'An error occurred while getting single membership; please try again later' });
  }
};

// export const updateOrRenewMembership = async (req: Request, res: Response) => {
//  if (!req.currentUser) {
//   return res.status(401).json({ error: "Unauthorized - user not authenticated "});
//  }
 
//   try {
//     const { membership_class, membership_duration, mappi_allowance } = req.body;

//     const updated = await membershipService.updateOrRenewMembership({
//       user: req.currentUser,
//       membership_class,
//       membership_duration,
//       mappi_allowance,
//     });

//     return res.status(200).json(updated);
//   } catch (error: any) {
//     logger.error("Failed to update or renew membership:", error);
//     return res.status(400).json({ error: error.message });
//   }
// };