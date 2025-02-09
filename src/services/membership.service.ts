import { IMembership, IUser } from "../types";
import Membership from "../models/Membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
import { TransactionType } from "../models/enums/transactionType";
import { createTransactionRecord } from "./transaction.service";
import logger from "../config/loggingConfig";

// Fetch a single membership by ID
export const getSingleMembershipById = async (membership_id: string): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();

    if (!membership) {
      throw new Error(`Membership with membershipID: ${membership_id} not found`);
    }

    return membership;
  } catch (error) {
    logger.error(`Failed to retrieve membership for membershipID ${ membership_id }:`, error);
    throw new Error('Failed to get membership; please try again later');
  }
};

// Manage Membership
export const addOrUpdateMembership = async (
  authUser: IUser,
  membership_class: MembershipClassType,
  mappi_amount: number,
  duration: number
): Promise<IMembership> => {

  const today = new Date();
  const durationInMs = duration * 7 * 24 * 60 * 60 * 1000; // Convert weeks to milliseconds

  try {
    // Check for an existing membership
    const existingMembership = await Membership.findOne({ membership_id: authUser.pi_uid }).exec();
    
    if (existingMembership) {
      // Use the later of today or the current expiration date
      const baseDate = existingMembership.membership_expiry_date
        ? new Date(Math.max(existingMembership.membership_expiry_date.getTime(), today.getTime()))
        : today;

      // Calculate the new expiration date by adding the duration to the base date
      const newExpirationDate = new Date(baseDate.getTime() + durationInMs);
      // Calculate the new Mappi balance
      const newMappiBalance = existingMembership.mappi_balance + mappi_amount;

      // Update the existing membership
      const updatedMembership = await Membership.findOneAndUpdate(
        { membership_id: authUser.pi_uid },
        { 
          $set: {
            membership_class_type: membership_class,
            membership_expiry_date: newExpirationDate,
            mappi_balance: newMappiBalance
          }
        }, 
        { new: true } // Return the updated document
      ).exec();

      logger.debug('Existing membership updated in the database:', updatedMembership);

      await createTransactionRecord(
        authUser.pi_uid, 
        TransactionType.MAPPI_DEPOSIT, 
        mappi_amount, 
        `Mappi credited for updated Membership to ${membership_class}`
      );
      
      return updatedMembership as IMembership;
    } else {
      // Membership does not exist, calculate based on today's date
      const newExpirationDate = new Date(today.getTime() + durationInMs);

      // Create a new membership
      const newMembership = new Membership({
        membership_id: authUser.pi_uid,
        membership_class_type: membership_class,
        membership_expiry_date: newExpirationDate,
        mappi_balance: mappi_amount
      });
      const savedMembership = await newMembership.save();
      logger.info('New membership created in the database:', savedMembership);
      
      await createTransactionRecord(
        authUser.pi_uid,
        TransactionType.MAPPI_DEPOSIT,
        mappi_amount, 
        `Membership initiated to ${membership_class}`
      );
      
      return savedMembership as IMembership;
    }
  } catch (error) {
    logger.error(`Failed to add or update membership for membership ID: ${authUser.pi_uid}`, error);
    throw new Error("Failed to add or update membership; please try again later");
  }
};

export const updateMembershipBalance = async (
  membership_id: string,
  amount: number
): Promise<IMembership> => {
  try {
    // Find the membership
    const membership = await Membership.findOne({ membership_id }).exec();

    if (!membership) {
      throw new Error(`Membership not found for membership ID: ${membership_id}`);
    }
    
    // Calculate the new balance
    membership.mappi_balance = membership.mappi_balance + amount;
    const updatedMembership = await membership.save();

    logger.info(`Membership balance updated for membership ID: ${membership_id}`);
    return updatedMembership;
  } catch (error) {
    logger.error(`Failed to update membership balance for membership ID: ${membership_id}`, error);
    throw new Error("Failed to update membership balance; please try again later");
  }
};