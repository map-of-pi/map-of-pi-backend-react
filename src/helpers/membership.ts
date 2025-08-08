import { MembershipClassType, membershipTiers, SingleClassType } from '../models/enums/membershipClassType';
import logger from "../config/loggingConfig";

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

export const isOnlineShoppingClass = (tier: MembershipClassType): boolean =>
  [
    MembershipClassType.GREEN,
    MembershipClassType.GOLD,
    MembershipClassType.DOUBLE_GOLD,
    MembershipClassType.TRIPLE_GOLD,
  ].includes(tier);

export const isOfflineShoppingClass = (tier: MembershipClassType): boolean =>
  [
    MembershipClassType.CASUAL,
    MembershipClassType.WHITE,
  ].includes(tier);

export const isSameShoppingClassType = (a: MembershipClassType, b: MembershipClassType): boolean =>
  (isOnlineShoppingClass(a) && isOnlineShoppingClass(b)) || (isOfflineShoppingClass(a) && isOfflineShoppingClass(b));

export const getTierByClass = (tierClass: MembershipClassType) => {
  return Object.values(membershipTiers).find((tier) => tier.CLASS === tierClass);
};

export const getTierRank = (tierClass: MembershipClassType): number => {
  return getTierByClass(tierClass)?.RANK ?? -1;
};

export const isSingleClass = (tier: SingleClassType): boolean =>
  tier === SingleClassType.SINGLE; 
