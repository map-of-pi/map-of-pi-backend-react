import { IMembership, PaymentDataType, IUser } from "../types";
import Membership from "../models/Membership"
import { MembershipClassType, membershipTiers } from "../models/enums/membershipClassType";
import logger from "../config/loggingConfig";
import User from "../models/User";
import {
  isExpired,
  isSameCategory,
  getTierByClass,
  getTierRank
} from "../helpers/membership";

export interface MembershipOption {
  value: MembershipClassType;
  cost: number;
  duration: number | null; // in weeks
  mappi_allowance: number;
}

export const buildMembershipList = async (): Promise<MembershipOption[]> => {
  return Object.values(membershipTiers)
    .filter(tier => tier.CLASS !== MembershipClassType.CASUAL) // Exclude default
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
};

export const getUserMembership= async (authUser: IUser) => {
  const membership = await Membership.findOne({ pi_uid: authUser.pi_uid }).lean();
  return membership || null;
};

export const getSingleMembershipById = async (membership_id: string) => {
  const membership = await Membership.findById(membership_id).lean();
  return membership || null;
};

export const updateOrRenewMembershipAfterPayment = async (paymentData: PaymentDataType, authUser: IUser) => {
  const metadata = paymentData.metadata?.MembershipPayment;

  if (!metadata || !metadata.membership_class)
    throw new Error('Missing membership metadata');

  const user = await User.findOne({ pi_uid: authUser.pi_uid });
  if (!user) throw new Error(`User not found with pi_uid: ${authUser.pi_uid}`);

  return await updateOrRenewMembership(authUser, metadata.membership_class);
};

export const updateOrRenewMembership = async (authUser: IUser, membership_class: MembershipClassType): Promise<IMembership> => {
  const user = await User.findOne({ pi_uid:authUser.pi_uid }).lean();
  const today = new Date();

  const tier = getTierByClass(membership_class);
  const durationMs = (tier?.DURATION ?? 0) * 7 * 24 * 60 * 60 * 1000;

  if (!tier) throw new Error(`Invalid membership class: ${membership_class}`);

  const membership_duration = tier.DURATION;
  const mappi_allowance = tier.MAPPI_ALLOWANCE;

  const existing = await Membership.findOne({ user_id: user?._id });

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
  const expired = isExpired(existing.membership_expiration ?? undefined);

  if (!isSameCategory(existing.membership_class, membership_class)) {
    Object.assign(existing, {
      membership_class,
      membership_expiration: membership_duration ? new Date(today.getTime() + durationMs) : null,
      mappi_balance: mappi_allowance + existing.mappi_balance,
      // mappi_used_to_date: 0,
    });
    return await existing.save();
  }

  if (newRank === currentRank && !expired) {
    existing.membership_expiration = new Date((existing.membership_expiration?.getTime() ?? today.getTime()) + durationMs);
    existing.mappi_balance = mappi_allowance + existing.mappi_balance;
    // existing.mappi_used_to_date = 0;
    return await existing.save();
  }

  if (newRank === currentRank && expired) {
    Object.assign(existing, {
      membership_expiration: new Date(today.getTime() + durationMs),
      mappi_balance: mappi_allowance,
      // mappi_used_to_date: 0,
    });
    return await existing.save();
  }

  if (newRank > currentRank || newRank < currentRank) {
    Object.assign(existing, {
      membership_class,
      membership_expiration: new Date(today.getTime() + durationMs),
      mappi_balance: mappi_allowance + existing.mappi_balance,
      // mappi_used_to_date: 0,
    });
    return await existing.save();
  }

  throw new Error('Unhandled membership transition');
};

export const updateMappiBalance = async (membership_id: string, amount: number) => {
  const membership = await Membership.findById(membership_id);
  if (!membership) throw new Error('Membership not found');

  membership.mappi_balance += amount;
  return await membership.save();
};
