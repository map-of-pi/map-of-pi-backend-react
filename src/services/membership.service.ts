import { IMembership, IUser } from "../types";
import Membership from "../models/membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
// import { TransactionType } from "../models/enums/transactionType";
// import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";

// Fetch a single membership by ID
export const getSingleMembershipById = async (
  membership_id: string
): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findById(membership_id).exec();

    if (!membership) {
      logger.warn(`Membership does not exist for membership ID: ${membership_id}`);
      return null;
    }

    return membership.toObject() as unknown as IMembership;
  } catch (error) {
    logger.error(`Failed to retrieve membership for membership ID: ${membership_id}:`, error);
    throw new Error("Failed to get membership; please try again later");
  }
};

// Placeholder for the real payment-based membership logic
export const updateOrRenewMembership = async ({
  pi_uid,
  membership_class,
  duration_weeks,
  mappi_allowance,
}: {
  pi_uid: string;
  membership_class: MembershipClassType;
  duration_weeks: number;
  mappi_allowance: number;
}): Promise<IMembership> => {
  // TODO: Implement full logic based on upgrade/renew/downgrade
  return {} as IMembership;
};

// Update Mappi Balance associated with the membership
export const updateMappiBalance = async (
  membership_id: string,
  // transaction_type: TransactionType,
  amount: number
): Promise<IMembership> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();
    if (!membership) {
      throw new Error(`Membership not found for membership ID: ${membership_id}`);
    }

    // const adjustment =
    //   transaction_type === TransactionType.MAPPI_DEPOSIT ? amount :
    //   transaction_type === TransactionType.MAPPI_WITHDRAWAL ? -amount : 0;

    // membership.mappi_balance += adjustment;

    const updatedMembership = await membership.save();

    logger.info(`Mappi balance updated for membership ID: ${membership_id}`);
    return updatedMembership.toObject() as unknown as IMembership;
  } catch (error) {
    logger.error(`Failed to update Mappi balance for membership ID: ${membership_id}`, error);
    throw new Error("Failed to update Mappi balance; please try again later");
  }
};
