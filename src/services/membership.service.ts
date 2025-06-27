import { IMembership, IUser } from "../types";
import Membership from "../models/membership";
import { MembershipClassType, tierRank } from "../models/enums/membershipClassType";
// import { TransactionType } from "../models/enums/transactionType";
// import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";

const isExpired = (date?: Date) => !date || date < new Date();

const isOnlineClass = (tier: MembershipClassType): boolean => {
  return [
    MembershipClassType.GOLD,
    MembershipClassType.DOUBLE_GOLD,
    MembershipClassType.TRIPLE_GOLD,
    MembershipClassType.GREEN,
  ].includes(tier);
};

const isInstoreClass = (tier: MembershipClassType): boolean => {
  return tier === MembershipClassType.MEMBER;
};

const isSameCategory = (a: MembershipClassType, b: MembershipClassType): boolean => {
  return (isOnlineClass(a) && isOnlineClass(b)) || (isInstoreClass(a) && isInstoreClass(b));
};

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
  membership_duration,
  mappi_allowance,
}: {
  pi_uid: string;
  membership_class: MembershipClassType;
  membership_duration: number;
  mappi_allowance: number;
}): Promise<IMembership> => {
  const today = new Date();
  const durationMs = membership_duration * 7 * 24 * 60 * 60 * 1000;

  const existing = await Membership.findOne({ pi_uid }).exec();

  // Validation maps
  const maxMembershipDurations: Record<MembershipClassType, number> = {
    [MembershipClassType.TRIPLE_GOLD]: 50,
    [MembershipClassType.DOUBLE_GOLD]: 20,
    [MembershipClassType.GOLD]: 10,
    [MembershipClassType.GREEN]: 4,
    [MembershipClassType.MEMBER]: 50,
    [MembershipClassType.CASUAL]: 0,
  };

  const requiredMappiAllowances: Record<MembershipClassType, number> = {
    [MembershipClassType.TRIPLE_GOLD]: 1600,
    [MembershipClassType.DOUBLE_GOLD]: 1200,
    [MembershipClassType.GOLD]: 800,
    [MembershipClassType.GREEN]: 400,
    [MembershipClassType.MEMBER]: 400,
    [MembershipClassType.CASUAL]: 0,
  };

  const maxAllowedDuration = maxMembershipDurations[membership_class];
  const requiredMappi = requiredMappiAllowances[membership_class];

  if (maxAllowedDuration === undefined || requiredMappi === undefined) {
    throw new Error(`Invalid membership class: ${membership_class}`);
  }

  if (membership_duration > maxAllowedDuration) {
    throw new Error(`${membership_class} cannot exceed ${maxAllowedDuration} weeks`);
  }

  if (mappi_allowance !== requiredMappi) {
    throw new Error(`${membership_class} requires exactly ${requiredMappi} mappi`);
  }

  if (!existing) {
    // Fresh membership
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

  // Category restriction check
  if (!isSameCategory(existing.membership_class, membership_class)) {
    logger.error(`Cross-category transition from ${existing.membership_class} to ${membership_class} is not allowed`);
    throw new Error("Cannot switch between online and instore memberships");
  }

  const currentTier = tierRank[existing.membership_class];
  const incomingTier = tierRank[membership_class];
  const expired = isExpired(existing.membership_expiration ?? undefined);

  // Same Tier + Active → Extend expiration
  if (incomingTier === currentTier && !expired) {
    existing.membership_expiration = new Date(
      (existing.membership_expiration?.getTime() ?? today.getTime()) + durationMs
    );

    const updated = await existing.save();
    logger.info(`Extended current membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // Same Tier + Expired → Renew
  if (incomingTier === currentTier && expired) {
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance = requiredMappi;
    existing.mappi_used_to_date = 0;

    const updated = await existing.save();
    logger.info(`Renewed expired membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  // Upgrade to a higher tier
  if (incomingTier > currentTier) {
    existing.membership_class = membership_class;
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance = requiredMappi; // overwrite, no stacking
    existing.mappi_used_to_date = 0;

    const updated = await existing.save();
    logger.info(`Upgraded membership for ${pi_uid}`);
    return updated.toObject() as unknown as IMembership;
  }

  if (mappi_allowance !== requiredMappi) {
    throw new Error(`${membership_class} requires exactly ${requiredMappi} mappi`);
  }
  
  // Downgrade to a lower tier
  if (incomingTier < currentTier) {
    existing.membership_class = membership_class;
    existing.membership_expiration = new Date(today.getTime() + durationMs);
    existing.mappi_balance = requiredMappi; // reset to new tier's cap
    existing.mappi_used_to_date = 0;

  const updated = await existing.save();
  logger.info(`Downgraded membership for ${pi_uid}`);
  return updated.toObject() as unknown as IMembership;
  }

  // Fallback
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
