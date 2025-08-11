import {
  isExpired,
  isSameShoppingClassType,
  getTierByClass,
  getTierRank,
} from "../helpers/membership";
import Membership from "../models/Membership";
import User from "../models/User";
import { MembershipClassType, membershipTiers, CreditType, creditOptions } from "../models/enums/membershipClassType";
import { IMembership, IUser, MembershipOption } from "../types";

import logger from "../config/loggingConfig";

export const buildMembershipList = async (): Promise<MembershipOption[]> => {
  // Single class at the top
  const purchaseOptions: MembershipOption = {
    value: CreditType.SINGLE as unknown as MembershipClassType, // Casting so type fits MembershipOption
    cost: creditOptions.COST,
    duration: creditOptions.DURATION ?? null,
    mappi_allowance: creditOptions.MAPPI_ALLOWANCE ?? 0,
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

  return [purchaseOptions, ...membershipOptions];
};

export const getUserMembership = async (authUser: IUser): Promise<IMembership> => {
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
};

export const getSingleMembershipById = async (membership_id: string) => {
  const membership = await Membership.findById(membership_id).lean();
  return membership || null;
};

export const updateOrRenewMembership = async (
  piUid: string, 
  membership_class: MembershipClassType | CreditType
): Promise<IMembership> => {
  const user = await User.findOne({ pi_uid: piUid }).lean();
  const today = new Date();
  if (!user) throw new Error(`User with pi_uid ${piUid} not found`);

  const existing = await Membership.findOne({ user_id: user?._id });

  // Handle Single Class case
  if (membership_class === CreditType.SINGLE) {
    if (!existing) {
      // If user doesn't have a membership, create a base membership with 1 mappi
      return await new Membership({
        user_id: user._id,
        pi_uid: user.pi_uid,
        membership_class: MembershipClassType.CASUAL,
        membership_expiry_date: null,
        mappi_balance: 1,
        mappi_used_to_date: 0,
      }).save();
    }

    // If membership exists, just add 1 to mappi_balance
    existing.mappi_balance += 1;
    return await existing.save();
  }

  // MembershipClass flow (White, Green, etc.)
  const tier = getTierByClass(membership_class as MembershipClassType);
  if (!tier) throw new Error(`Invalid membership class: ${membership_class}`);
  
  const membership_duration = tier.DURATION;
  const durationMs = (membership_duration ?? 0) * 7 * 24 * 60 * 60 * 1000;
  const mappi_allowance = tier.MAPPI_ALLOWANCE;

  if (!existing) {
    return await new Membership({
      user_id: user?._id,
      pi_uid: user?.pi_uid,
      membership_class,
      membership_expiration: membership_duration ? new Date(today.getTime() + durationMs) : null,
      mappi_balance: mappi_allowance,
      mappi_used_to_date: 0,
    }).save();
  }

  const currentRank = getTierRank(existing.membership_class);
  const newRank = tier.RANK;
  const expired = isExpired(existing.membership_expiry_date ?? undefined);

  if (!isSameShoppingClassType(existing.membership_class, membership_class)) {
    Object.assign(existing, {
      membership_class,
      membership_expiry_date: membership_duration ? new Date(today.getTime() + durationMs) : null,
      mappi_balance: mappi_allowance,
    });
    return await existing.save();
  }

  if (newRank === currentRank && !expired) {
    existing.membership_expiry_date = new Date((existing.membership_expiry_date?.getTime() ?? today.getTime()) + durationMs);
    existing.mappi_balance = mappi_allowance + existing.mappi_balance;
    return await existing.save();
  }

  if (newRank === currentRank && expired) {
    Object.assign(existing, {
      membership_expiry_date: new Date(today.getTime() + durationMs),
      mappi_balance: mappi_allowance,
    });
    return await existing.save();
  }

  if (newRank > currentRank || newRank < currentRank) {
    Object.assign(existing, {
      membership_class,
      membership_expiration: new Date(today.getTime() + durationMs),
      mappi_balance: mappi_allowance + existing.mappi_balance,
    });
    return await existing.save();
  }

  throw new Error('Unhandled membership transition');
};

export const updateMappiBalance = async (pi_uid: string, amount: number) => {
  const membership = await Membership.findOne({pi_uid: pi_uid}).exec();
  if (!membership) throw new Error('Membership not found');

  membership.mappi_balance += amount;
  return await membership.save();
};