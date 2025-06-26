import { IMembership, IUser } from "../types";
import Membership from "../models/membership";
import { MembershipClassType, tierRank } from "../models/enums/membershipClassType";
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
  const today = new Date();
  const durationMs = duration_weeks * 7 * 24 * 60 * 60 * 1000;

  const existing = await Membership.findOne({ pi_uid }).exec();
  const isExpired = !existing?.membership_expiration || new Date(existing.membership_expiration) < today;

  if (!existing) {
    // No existing membership — create fresh
    const newMembership = new Membership({
      pi_uid,
      membership_class,
      membership_expiration: new Date(today.getTime() + durationMs),
      mappi_balance: mappi_allowance,
      mappi_used_to_date: 0,
    });

    const saved = await newMembership.save();
    logger.info(`Created new membership for ${pi_uid}`);
    return saved as unknown as IMembership;
  }

  const currentTier = tierRank[existing.membership_class];
  const incomingTier = tierRank[membership_class];

  // 🟡 Case 1: Same Tier + Still Active = Extend expiration
  if (incomingTier === currentTier && !isExpired) {
    existing.membership_expiration = new Date(
      (existing.membership_expiration?.getTime() ?? today.getTime()) + durationMs
    );

    const updated = await existing.save();
    logger.info(`Extended current membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // 🟠 Case 2: Same Tier + Expired = Treat as new membership
  if (incomingTier === currentTier && isExpired) {
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance = mappi_allowance;
    existing.mappi_used_to_date = 0;

    const updated = await existing.save();
    logger.info(`Renewed expired membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // 🟢 Case 3: Upgrade (higher tier)
  if (incomingTier > currentTier) {
    existing.membership_class = membership_class;
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance += mappi_allowance;
    existing.mappi_used_to_date = 0; // optional: reset if needed

    const updated = await existing.save();
    logger.info(`Upgraded membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // 🔴 Case 4: Downgrade
  if (incomingTier < currentTier) {
    existing.membership_class = membership_class;
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance = mappi_allowance;
    existing.mappi_used_to_date = 0;

    const updated = await existing.save();
    logger.info(`Downgraded membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // 🧯 Case 5: Unknown fallback
  logger.error(`Unhandled membership transition for ${pi_uid}`);
  throw new Error("Unhandled membership transition");
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
