import { IMembership, IUser } from "../types";
import Membership from "../models/membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
// import { TransactionType } from "../models/enums/transactionType";
// import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";

// Fetch a single membership by ID
export const getSingleMembershipById = async (
  membership_id: string
): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();

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

// Manage Membership
// !!! Legacy function — used only by legacy manageMembership controller.
// Membership upgrades in production should go through the U2A payment flow.
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
      const baseDate = existingMembership.membership_expiration
        ? new Date(Math.max(existingMembership.membership_expiration.getTime(), today.getTime()))
        : today;

      const newExpirationDate = new Date(baseDate.getTime() + durationInMs);
      const newMappiBalance = existingMembership.mappi_balance + mappi_allowance;

      existingMembership.membership_class = membership_class;
      existingMembership.membership_expiration = newExpirationDate;
      existingMembership.mappi_balance = newMappiBalance;

      const updatedMembership = await existingMembership.save({ session });

      // await createTransactionRecord(
      //   authUser.pi_uid,
      //   TransactionType.MAPPI_DEPOSIT,
      //   mappi_allowance,
      //   `Mappi credited for updated Membership to ${membership_class}`
      // );

      await session.commitTransaction();
      session.endSession();

      logger.info("Membership updated:", updatedMembership);
      return updatedMembership.toObject() as unknown as IMembership;
    } else {
      const newExpirationDate = new Date(today.getTime() + durationInMs);

      const newMembership = new Membership({
        membership_id: authUser.pi_uid,
        membership_class,
        membership_expiration: newExpirationDate,
        mappi_balance: mappi_allowance
      });

      const savedMembership = await newMembership.save({ session });

      // await createTransactionRecord(
      //   authUser.pi_uid,
      //   TransactionType.MAPPI_DEPOSIT,
      //   mappi_allowance,
      //   `Membership initiated to ${membership_class}`
      // );

      await session.commitTransaction();
      session.endSession();

      logger.info("New membership created:", savedMembership);
      return savedMembership.toObject() as unknown as IMembership;
    }
  } catch (error) {
    logger.error(`Failed to add/update membership for ${authUser.pi_uid}:`, error);
    throw new Error("Failed to add or update membership; please try again later");
  }
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
