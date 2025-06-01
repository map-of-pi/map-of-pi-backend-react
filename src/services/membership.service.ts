import { IMembership, IUser } from "../types";
import Membership from "../models/Membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
import { TransactionType } from "../models/enums/transactionType";
import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";
import { isTierDowngrade } from "../utils/membershipUtils";

export async function updateMembershipAfterPayment(
  authUser: IUser,
  paymentMetadata: {
    membership_class?: MembershipClassType;
    durationWeeks?: number;
    mappi_allowance?: number;
  }
): Promise<IMembership | null> {
  if (!paymentMetadata?.membership_class) {
    // Not actually a membership purchase
    return null;
  }

  // Fallback logic for duration & allowance if not provided
  const membershipClass = paymentMetadata.membership_class;
  const membership_duration = paymentMetadata.durationWeeks ?? 4; // Default to 4 weeks
  const mappi_allowance = paymentMetadata.mappi_allowance ?? 0;   // Default to 0

  // Reuse existing function
  const updatedMembership = await addOrUpdateMembership(
    authUser,
    membershipClass,
    membership_duration,
    mappi_allowance
  );

  return updatedMembership;
}

// Fetch a single membership by ID
export const getSingleMembershipById = async (membership_id: string): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();

    if (!membership) {
      logger.warn(`Membership does not exist for membership ID: ${ membership_id }`);
    }

    return membership;
  } catch (error) {
    logger.error(`Failed to retrieve membership for membership ID: ${ membership_id }:`, error);
    throw new Error('Failed to get membership; please try again later');
  }
};

// Manage Membership
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

    const existingMembership = await Membership.findOne({ membership_id: authUser.pi_uid }).session(session).exec();

    if (existingMembership) {
      let newExpirationDate: Date;
      let newMappiBalance: number;

      if (isTierDowngrade(existingMembership.membership_class, membership_class)) {
        // Downgrade: reset everything
        newExpirationDate = new Date(today.getTime() + durationInMs);
        newMappiBalance = mappi_allowance;
      } else {
        // Renewal or upgrade
        const baseDate = existingMembership.membership_expiry_date
          ? new Date(Math.max(existingMembership.membership_expiry_date.getTime(), today.getTime()))
          : today;
        newExpirationDate = new Date(baseDate.getTime() + durationInMs);
        newMappiBalance = existingMembership.mappi_balance + mappi_allowance;
      }
      existingMembership.membership_class = membership_class;
      existingMembership.membership_expiry_date = newExpirationDate;
      existingMembership.mappi_balance = newMappiBalance;

      const updatedMembership = await existingMembership.save({ session });

      await createTransactionRecord(
        authUser.pi_uid,
        TransactionType.MAPPI_DEPOSIT,
        mappi_allowance,
        `Mappi credited for updated Membership to ${membership_class}`
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('Membership updated:', updatedMembership);
      return updatedMembership;
    } else {
      const newExpirationDate = new Date(today.getTime() + durationInMs);

      const newMembership = new Membership({
        membership_id: authUser.pi_uid,
        membership_class,
        membership_expiry_date: newExpirationDate,
        mappi_balance: mappi_allowance
      });

      const savedMembership = await newMembership.save({ session });

      await createTransactionRecord(
        authUser.pi_uid,
        TransactionType.MAPPI_DEPOSIT,
        mappi_allowance,
        `Membership initiated to ${membership_class}`
      );

      await session.commitTransaction();
      session.endSession();

      logger.info('New membership created:', savedMembership);
      return savedMembership;
    }
  } catch (error) {
    logger.error(`Failed to add/update membership for ${authUser.pi_uid}:`, error);
    throw new Error("Failed to add or update membership; please try again later");
  }
};

// Update Mappi Balance associated with the membership
export const updateMappiBalance = async (
  membership_id: string,
  transaction_type: TransactionType,
  amount: number
): Promise<IMembership> => {
  try {
    // Find the membership
    const membership = await Membership.findOne({ membership_id }).exec();
    if (!membership) {
      throw new Error(`Membership not found for membership ID: ${membership_id}`);
    }
    
    // Adjust the balance based on transaction type
    const adjustment = 
      transaction_type === TransactionType.MAPPI_DEPOSIT ? amount : 
      transaction_type === TransactionType.MAPPI_WITHDRAWAL ? -amount : 
      0;

    membership.mappi_balance += adjustment;

    const updatedMembership = await membership.save();

    logger.info(`Mappi balance updated for membership ID: ${membership_id}`);
    return updatedMembership;
  } catch (error) {
    logger.error(`Failed to update Mappi balance for membership ID: ${membership_id}`, error);
    throw new Error("Failed to update Mappi balance; please try again later");
  }
};