import Membership from "../models/Membership";
import { MembershipClassType } from "../models/enums/membershipClassType";
import { IMembership, IUser } from "../types";

import logger from "../config/loggingConfig";

// Fetch a single membership by ID
export const getSingleMembershipById = async (membership_id: string): Promise<IMembership | null> => {
  try {
    const membership = await Membership.findOne({ membership_id }).exec();
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
  mappi_allowance: number,
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
      const newMappiBalance = existingMembership.mappi_balance + mappi_allowance;

      // Update the existing membership
      const updatedMembership = await Membership.findOneAndUpdate(
        { membership_id: authUser.pi_uid },
        { 
          $set: {
            membership_class_type: membership_class,
            membership_expiry_date: newExpirationDate,
            mappi_balance: newMappiBalance
          },
          $push: {
            mappi_allowance_usage: {
              date: today,
              purpose: "Membership purchase",
              amount: mappi_allowance
            }
          }
        }, 
        { new: true } // Return the updated document
      ).exec();

      logger.debug('Membership updated in the database:', updatedMembership);
      return updatedMembership as IMembership;
    } else {
      // Membership does not exist, calculate based on today's date
      const newExpirationDate = new Date(today.getTime() + durationInMs);

      // Create a new membership
      const newMembership = new Membership({
        membership_id: authUser.pi_uid,
        membership_class_type: membership_class,
        membership_expiry_date: newExpirationDate,
        mappi_balance: mappi_allowance,
        mappi_allowance_usage: [
          {
            date: today,
            purpose: "Initial membership",
            amount: mappi_allowance
          }
        ]
      });
      const savedMembership = await newMembership.save();
      logger.info('New membership created in the database:', savedMembership);
      return savedMembership as IMembership;
    }
  } catch (error) {
    logger.error(`Failed to add or update membership for pi_uid: ${authUser.pi_uid}`, error);
    throw new Error("Failed to add or update membership; please try again later");
  }
};
