import logger from "../config/loggingConfig";
import membershipTiers from "../utils/membership.json"

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


export function getMembershipClassName(membershipClass: string): string {
  const tierKey = membershipClass as keyof typeof membershipTiers;
  const tierData = membershipTiers[tierKey];

  if (!tierData) {
    throw new Error(`Invalid membership_class "${membershipClass}"`);
  }

  return tierData.CLASS;
}
