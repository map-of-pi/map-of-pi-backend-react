import { IMembership, IUser } from "../types";
import Membership from "../models/Membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
import { TransactionType } from "../models/enums/transactionType";
import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";
import { isTierDowngrade, isSwitchingBetweenTypes  } from "../utils/membershipUtils";

// Handles membership update after a successful payment
export async function updateMembershipAfterPayment(
  authUser: IUser,
  paymentMetadata: {
    membership_class?: MembershipClassType;
    durationWeeks?: number;
    mappi_allowance?: number;
  }
): Promise<IMembership | null> {
  // Ignore payment if it's not for a membership
  if (!paymentMetadata?.membership_class) {
    return null;
  }

  // Use provided duration/mappi, or default to 4 weeks and 0 mappi
  const membershipClass = paymentMetadata.membership_class;
  const membership_duration = paymentMetadata.durationWeeks ?? 4;
  const mappi_allowance = paymentMetadata.mappi_allowance ?? 0;

  // Delegate to core membership logic
  const updatedMembership = await addOrUpdateMembership(
    authUser,
    membershipClass,
    membership_duration,
    mappi_allowance
  );

  return updatedMembership;
}

// Retrieve a single membership by ID
export const getSingleMembershipById = async (
  membership_id: string
): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();

    if (!membership) {
      logger.warn(`Membership does not exist for membership ID: ${membership_id}`);
    }

    return membership;
  } catch (error) {
    logger.error(`Failed to retrieve membership for membership ID: ${membership_id}:`, error);
    throw new Error("Failed to get membership; please try again later");
  }
};

// Core logic to add or update a user's membership based on business rules
export const addOrUpdateMembership = async (
  authUser: IUser,
  membership_class: MembershipClassType,
  membership_duration: number,
  mappi_allowance: number
): Promise<IMembership> => {
  const today = new Date();
  const durationInMs = membership_duration * 7 * 24 * 60 * 60 * 1000;

  try {
    const session = await Membership.startSession();
    session.startTransaction();

    const existingMembership = await Membership.findOne({
      membership_id: authUser.pi_uid
    }).session(session).exec();

    if (existingMembership) {
      // Determine whether to reset or stack based on downgrade or tier type switch
      let newExpirationDate: Date;
      let newMappiBalance: number;

      if (
        isTierDowngrade(existingMembership.membership_class, membership_class) ||
        isSwitchingBetweenTypes(existingMembership.membership_class, membership_class)
      ) {
        // Downgrade or switching between online <-> instore:
        // Reset expiration and mappi
        newExpirationDate = new Date(today.getTime() + durationInMs);
        newMappiBalance = mappi_allowance;
      } else {
        // Renewal or upgrade within same type:
        // Stack duration and add mappi to existing
        const baseDate = existingMembership.membership_expiry_date
          ? new Date(Math.max(existingMembership.membership_expiry_date.getTime(), today.getTime()))
          : today;
        newExpirationDate = new Date(baseDate.getTime() + durationInMs);
        newMappiBalance = existingMembership.mappi_balance + mappi_allowance;
      }

      // Apply updates
      existingMembership.membership_class = membership_class;
      existingMembership.membership_expiry_date = newExpirationDate;
      existingMembership.mappi_balance = newMappiBalance;

      const updatedMembership = await existingMembership.save({ session });

      // Record the transaction
      await createTransactionRecord(
        authUser.pi_uid,
        TransactionType.MAPPI_DEPOSIT,
        mappi_allowance,
        `Mappi credited for updated Membership to ${membership_class}`
      );

      await session.commitTransaction();
      session.endSession();

      logger.info("Membership updated:", updatedMembership);
      return updatedMembership;
    } else {
      // No existing membership: create a fresh one
      const newExpirationDate = new Date(today.getTime() + durationInMs);

      const newMembership = new Membership({
        membership_id: authUser.pi_uid,
        membership_class,
        membership_expiry_date: newExpirationDate,
        mappi_balance: mappi_allowance
      });

      const savedMembership = await newMembership.save({ session });

      // Record the initial transaction
      await createTransactionRecord(
        authUser.pi_uid,
        TransactionType.MAPPI_DEPOSIT,
        mappi_allowance,
        `Membership initiated to ${membership_class}`
      );

      await session.commitTransaction();
      session.endSession();

      logger.info("New membership created:", savedMembership);
      return savedMembership;
    }
  } catch (error) {
    logger.error(`Failed to add/update membership for ${authUser.pi_uid}:`, error);
    throw new Error("Failed to add or update membership; please try again later");
  }
};

// Adjusts Mappi balance directly (used for top-ups or spending)
export const updateMappiBalance = async (
  membership_id: string,
  transaction_type: TransactionType,
  amount: number
): Promise<IMembership> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();
    if (!membership) {
      throw new Error(`Membership not found for membership ID: ${membership_id}`);
    }

    // Adjust balance up/down depending on transaction type
    const adjustment =
      transaction_type === TransactionType.MAPPI_DEPOSIT
        ? amount
        : transaction_type === TransactionType.MAPPI_WITHDRAWAL
        ? -amount
        : 0;

    membership.mappi_balance += adjustment;

    const updatedMembership = await membership.save();

    logger.info(`Mappi balance updated for membership ID: ${membership_id}`);
    return updatedMembership;
  } catch (error) {
    logger.error(`Failed to update Mappi balance for membership ID: ${membership_id}`, error);
    throw new Error("Failed to update Mappi balance; please try again later");
  }
};
