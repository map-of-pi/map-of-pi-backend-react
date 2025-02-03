import Membership from "../models/Membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
import { IMembership, IUser } from "../types";

import logger from "../config/loggingConfig";

// Deduct Mappi
export const deductMappi = async (pi_uid: string): Promise<number> => {
  try {
    // Fetch the membership record for the user
    const membership = await Membership.findOneAndUpdate(
      { pi_uid, mappi_balance: { $gte: 1 } },
      { $inc: { mappi_balance: -1, mappi_used_to_date: 1 } },
      { new: true, projection: { mappi_balance: 1 } }
    );

    if (!membership) {
      logger.warn(`Membership not found or insufficient balance for pi_uid: ${pi_uid}`);
      throw new Error("Membership not found or insufficient balance");
    }

    logger.info(
      `Mappi deducted for pi_uid: ${pi_uid}. Remaining balance: ${membership.mappi_balance}`
    );
    return membership.mappi_balance;
  } catch (error) {
    logger.error(`Failed to deduct mappi for pi_uid: ${pi_uid}. Error: ${(error as Error).message}`, error);
    throw new Error("Failed to deduct mappi; please try again later");
  }
};