import logger from "../config/loggingConfig";
import { MembershipClassType, membershipTiers } from '../models/enums/membershipClassType';

export const MembershipSubscription = async () => {
  try {
    // Simulate fetching membership subscription data from an API or database
    const subscriptionData = {
      userId: "12345",
      subscriptionId: "abcde",
      status: "active",
      plan: "premium",
    };

    // Log the subscription data
    logger.info("Membership Subscription Data: ", subscriptionData);

    // Process the subscription data (e.g., save to database, send confirmation email, etc.)
    // This is a placeholder for actual processing logic
    const processedData = {
      ...subscriptionData,
      processedAt: new Date(),
    };

    logger.info("Processed Membership Subscription Data: ", processedData);
  } catch (error) {
    logger.error(`Error processing membership subscription: ${error}`);
    throw error;
  }
}

export const isExpired = (date?: Date): boolean => !date || date < new Date();

export const isOnlineClass = (tier: MembershipClassType): boolean =>
  [
    MembershipClassType.GOLD,
    MembershipClassType.DOUBLE_GOLD,
    MembershipClassType.TRIPLE_GOLD,
    MembershipClassType.GREEN,
  ].includes(tier);

export const isInstoreClass = (tier: MembershipClassType): boolean =>
  tier === MembershipClassType.SINGLE || tier === MembershipClassType.WHITE;

export const isSameCategory = (a: MembershipClassType, b: MembershipClassType): boolean =>
  (isOnlineClass(a) && isOnlineClass(b)) || (isInstoreClass(a) && isInstoreClass(b));

export const getTierByClass = (tierClass: MembershipClassType) => {
  return Object.values(membershipTiers).find((tier) => tier.CLASS === tierClass);
};

export const getTierRank = (tierClass: MembershipClassType): number => {
  return getTierByClass(tierClass)?.RANK ?? -1;
};
