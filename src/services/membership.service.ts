import Membership from "../models/membership";
import logger from "../config/loggingConfig";
import { MembershipType } from "../models/enums/memberShipType";

// Retrieve Membership Status
export const getMembershipStatus = async (
  user_id: string
): Promise<{
  membership_class: string;
  mappi_balance: number;
  membership_expiration: Date | null;
} | null> => {
  try {
    // Fetch membership by user_id
    const membership = await Membership.findOne({ user_id }).exec();

    if (!membership) {
      logger.warn(`Membership not found for user_id: ${user_id}`);
      return null;
    }

    return {
      membership_class: membership.membership_class,
      mappi_balance: membership.mappi_balance,
      membership_expiration: membership.membership_expiration ?? null,
    };
  } catch (error) {
    logger.error(`Failed to retrieve membership status for user_id: ${user_id}`, error);
    throw new Error("Failed to retrieve membership status; please try again later");
  }
};

// Upgrade Membership
export const upgradeMembership = async (
  user_id: string,
  newMembershipClass: MembershipType,
  mappiAllowance: number,
  durationWeeks: number
): Promise<any> => {
  try {
    // Fetch the membership record for the user
    const membership = await Membership.findOne({ user_id }).exec();

    if (!membership) {
      logger.warn(`Membership not found for user_id: ${user_id}`);
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

    logger.info(`Membership upgraded for user_id: ${user_id}`);
    return membership;
  } catch (error) {
    logger.error(`Failed to upgrade membership for user_id: ${user_id}`, error);
    throw new Error("Failed to upgrade membership; please try again later");
  }
};

// Deduct Mappi
export const deductMappi = async (user_id: string): Promise<number> => {
  try {
    // Fetch the membership record for the user
    const membership = await Membership.findOne({ user_id }).exec();

    if (!membership) {
      logger.warn(`Membership not found for user_id: ${user_id}`);
      throw new Error("User not found");
    }

    if (membership.mappi_balance <= 0) {
      logger.warn(`Insufficient mappi balance for user_id: ${user_id}`);
      throw new Error("Insufficient mappi balance");
    }

    // Deduct 1 mappi
    membership.mappi_balance -= 1;
    membership.mappi_used_to_date += 1;
    await membership.save();

    logger.info(
      `Mappi deducted for user_id: ${user_id}. Remaining balance: ${membership.mappi_balance}`
    );
    return membership.mappi_balance;
  } catch (error) {
    logger.error(`Failed to deduct mappi for user_id: ${user_id}`, error);
    throw new Error("Failed to deduct mappi; please try again later");
  }
};
