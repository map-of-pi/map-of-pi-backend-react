import {
  isExpired,
  isSameShoppingClassType,
  getTierByClass,
  getTierRank,
} from "../helpers/membership";
import Membership from "../models/Membership";
import User from "../models/User";
import { 
  MembershipClassType, 
  membershipTiers, 
  MappiCreditType, 
  mappiCreditOptions 
} from "../models/enums/membershipClassType";
import { IMembership, IUser, MembershipOption } from "../types";

import logger from "../config/loggingConfig";

export const buildMembershipList = async (): Promise<MembershipOption[]> => {
  try {
    // Single class at the top
    const purchaseOptions: MembershipOption = {
      value: MappiCreditType.SINGLE as unknown as MembershipClassType, // Casting so type fits MembershipOption
      cost: mappiCreditOptions.COST,
      duration: mappiCreditOptions.DURATION ?? null,
      mappi_allowance: mappiCreditOptions.MAPPI_ALLOWANCE ?? 0,
    };

    // Membership tiers except CASUAL
    const membershipOptions = Object.values(membershipTiers)
      .filter(tier => tier.CLASS !== MembershipClassType.CASUAL) 
      .map((tier) => ({
        value: tier.CLASS as MembershipClassType,
        cost: tier.COST,
        duration: tier.DURATION ?? null,
        mappi_allowance: tier.MAPPI_ALLOWANCE ?? 0,
      }))
      .sort((a, b) => {
        const rankA = Object.values(membershipTiers).find(t => t.CLASS === a.value)?.RANK ?? 0;
        const rankB = Object.values(membershipTiers).find(t => t.CLASS === b.value)?.RANK ?? 0;
        return rankA - rankB;
      });

    return [purchaseOptions, ...membershipOptions]
  } catch (error) {
    logger.error('Failed to build membership list', { error });
    throw error; 
  }
};

export const getUserMembership = async (authUser: IUser): Promise<IMembership> => {
  try {
    const membership = await Membership.findOne({ pi_uid: authUser.pi_uid }).lean();
    const user = await User.findOne({ pi_uid:authUser.pi_uid }).lean();
    
    if (!membership) {
      const newMembership = await new Membership({
        user_id: user?._id,
        pi_uid: authUser.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        membership_expiry_date:  null,
        mappi_balance: 0,
        mappi_used_to_date: 0,
      }).save()

      return newMembership.toObject()
    }
    return membership;
  } catch (error) {
    logger.error(`Failed to get user membership for piUID ${ authUser.pi_uid }: ${ error }`);
    throw error;
  }
};

export const getSingleMembershipById = async (membership_id: string) => {
  try {
    const membership = await Membership.findById(membership_id).lean();
    return membership || null;
  } catch (error) {
    logger.error(`Failed to get single membership with ID ${ membership_id }: ${ error }`);
    return error;
  }
};

export const updateOrRenewMembership = async (
  piUid: string, 
  membership_class: MembershipClassType | MappiCreditType
): Promise<IMembership> => {
  const today = new Date();

  // Get user first
  const user = await User.findOne({ pi_uid: piUid }).lean();
  if (!user) {
    throw new Error(`User with pi_uid ${piUid} not found`);
  }

  // Get existing membership if any
  const existing = await Membership.findOne({ user_id: user?._id });

  // Handle Single Mappi purchase case
  if (membership_class === MappiCreditType.SINGLE) {
    logger.info(`Processing single mappi purchase for user ${ piUid }`);

    if (!existing) {
      // If user doesn't have a membership, create the base membership with 1 mappi
      return await new Membership({
        user_id: user._id,
        pi_uid: user.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        membership_expiry_date: null,
        mappi_balance: 1,
        mappi_used_to_date: 0,
      }).save();
    }

    // If membership exists, check if it's expired
    const expired = isExpired(existing.membership_expiry_date ?? undefined);
    
    // If expired, reset to casual membership with 1 mappi
    if (expired && existing.membership_class !== MembershipClassType.CASUAL) {
      logger.info(`Expired membership reset to casual for ${ piUid }`);      
      existing.membership_class = MembershipClassType.CASUAL;
      existing.membership_expiry_date = null;
      existing.mappi_balance = 1;
    }

    existing.mappi_balance = (existing.mappi_balance ?? 0) + 1; // safeguard
    return await existing.save();
  }

  // Membership class flow (White, Green, etc.)
  const tier = getTierByClass(membership_class as MembershipClassType);
  if (!tier) {
    throw new Error(`Invalid membership class: ${membership_class}`);
  }
  
  const durationMs = (tier.DURATION ?? 0) * 7 * 24 * 60 * 60 * 1000; // weeks to ms
  const mappi_allowance = tier.MAPPI_ALLOWANCE;
  const newExpiryDate = tier.DURATION ? new Date(today.getTime() + durationMs) : null;
  const newRank = tier.RANK;

  // If no existing membership, create new membership
  if (!existing) {
    logger.info(`Creating new membership ${membership_class} for user ${piUid}`);
    return await new Membership({
      user_id: user._id,
      pi_uid: user.pi_uid,
      membership_class,
      membership_expiry_date: newExpiryDate,
      mappi_balance: mappi_allowance,
      mappi_used_to_date: 0,
    }).save();
  }

  const currentRank = getTierRank(existing.membership_class);
  const expired = isExpired(existing.membership_expiry_date ?? undefined);
  const sameClassType = isSameShoppingClassType(existing.membership_class, membership_class);

  // Different class type (e.g., online shopping vs offline shopping)
  if (!sameClassType) {
    logger.info(`Switching membership type for ${piUid} to ${membership_class}`);
    Object.assign(existing, {
      membership_class,
      membership_expiry_date: newExpiryDate,
      mappi_balance: mappi_allowance,
    });
    return await existing.save();
  }

  // Same rank & not expired then extend membership & add mappi
  if (newRank === currentRank && !expired) {
    logger.info(`Extending membership ${membership_class} for ${piUid}`);
    existing.membership_expiry_date = new Date((existing.membership_expiry_date?.getTime() ?? today.getTime()) + durationMs);
    existing.mappi_balance = (existing.mappi_balance ?? 0) + mappi_allowance;
    return await existing.save();
  }

  // Same rank & expired then reset expiry & mappi
  if (newRank === currentRank && expired) {
    logger.info(`Renewing expired membership ${membership_class} for ${piUid}`);
    Object.assign(existing, {
      membership_expiry_date: newExpiryDate,
      mappi_balance: mappi_allowance,
    });
    return await existing.save();
  }

  // Rank change with upgrade or downgrade
  if (newRank !== currentRank) {
    logger.info(`Changing rank from ${existing.membership_class} to ${membership_class} for ${piUid}`);
    Object.assign(existing, {
      membership_class,
      membership_expiry_date: newExpiryDate,
      mappi_balance: (existing.mappi_balance ?? 0) + mappi_allowance
    });
    return await existing.save();
  }

  throw new Error(`Unhandled membership transition for ${piUid}`);
};

export const updateMappiBalance = async (pi_uid: string, amount: number) => {
  try {
    const membership = await Membership.findOne({pi_uid: pi_uid}).exec();
    if (!membership) {
      throw new Error('Membership not found');
    }

    membership.mappi_balance = (membership.mappi_balance ?? 0) + amount;
    return await membership.save();
  } catch (error) {
    logger.error(`Failed to update Mappi balance for piUID ${ pi_uid }: ${ error}`);
    throw error;
  }
};