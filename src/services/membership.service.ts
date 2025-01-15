import Membership from "../models/Membership";
import logger from "../config/loggingConfig";
import { MembershipType } from "../models/enums/membershipType";
import mongoose from "mongoose";

// Retrieve Membership Status
export const getMembershipStatus = async (
  pi_uid: string
): Promise<{
  membership_class: string;
  mappi_balance: number;
  membership_expiration: Date | null;
} | null> => {
  try {
    // Fetch membership by pi_uid
    if (!mongoose.Types.ObjectId.isValid(pi_uid)) {
      logger.warn(`Invalid pi_uid format: ${pi_uid}`);
      throw new Error("Invalid pi_uid format");
    }

    const membership = await Membership.findOne({ pi_uid }).exec();
    if (!membership) {
      logger.warn(`Membership not found for pi_uid: ${pi_uid}`);
      return null;
    }

    return {
      membership_class: membership.membership_class,
      mappi_balance: membership.mappi_balance,
      membership_expiration: membership.membership_expiration ?? null,
    };
  } catch (error) {
    logger.error(`Failed to retrieve membership status for pi_uid: ${pi_uid}. Error: ${(error as Error).message}`, error);
    throw new Error("Failed to retrieve membership status; please try again later");
  }
};

// Upgrade Membership
export const upgradeMembership = async (
  pi_uid: string,
  newMembershipClass: MembershipType,
  mappiAllowance: number,
  durationWeeks: number
): Promise<any> => {
  try {
    // Fetch the membership record for the user
    if (!mongoose.Types.ObjectId.isValid(pi_uid)) {
      logger.warn(`Invalid pi_uid format: ${pi_uid}`);
      throw new Error("Invalid pi_uid format");
    }

    if (mappiAllowance <= 0 || durationWeeks <= 0) {
      throw new Error("Invalid input values");
    }

    const membership = await Membership.findOne({ pi_uid }).exec();
    if (!membership) {
      logger.warn(`Membership not found for pi_uid: ${pi_uid}`);
      return null;
    }

     // Validate the new membership class
     if (!Object.values(MembershipType).includes(newMembershipClass)) {
        throw new Error("Invalid membership class provided");
      }

    // Calculate the new expiration date
    const currentDate = new Date();
    const newExpirationDate = membership.membership_expiration
      ? new Date(
          Math.max(
            membership.membership_expiration.getTime(),
            currentDate.getTime()
          ) +
            durationWeeks * 7 * 24 * 60 * 60 * 1000
        )
      : new Date(currentDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

    // Update fields
    membership.membership_class = newMembershipClass as MembershipType;
    membership.mappi_balance += mappiAllowance;
    membership.membership_expiration = newExpirationDate;

    // Save updated membership
    await membership.save();

    logger.info(`Membership upgraded for pi_uid: ${pi_uid}`);
    return membership;
  } catch (error) {
    logger.error(`Failed to upgrade membership for pi_uid: ${pi_uid}. Error: ${(error as Error).message}`, error);
    throw new Error("Failed to upgrade membership; please try again later");
  }
};

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
