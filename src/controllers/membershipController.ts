import Membership from "../models/membership";
import { Request, Response } from "express";

export const getMembershipStatus = async (req: Request, res: Response) => {
  const userId = req.params.user_id;

  try {
    const membership = await Membership.findOne({ user_id: userId });

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    res.status(200).json({
      membership_class: membership.membership_class,
      mappi_balance: membership.mappi_balance,
      membership_expiration: membership.membership_expiration,
    });
  } catch (error) {
    console.error("Error fetching membership status:", error);
    res.status(500).json({ message: "Failed to fetch membership status" });
  }
};

export const upgradeMembership = async (req: Request, res: Response) => {
    const { user_id, newMembershipClass, mappiAllowance, durationWeeks } = req.body;
  
    try {
      // Find the user's membership record
      const membership = await Membership.findOne({ user_id });
  
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
  
      const currentDate = new Date().getTime();
      let remainingTime = 0;
  
      if (membership.membership_expiration) {
        const expirationTime = membership.membership_expiration.getTime();
        if (expirationTime > currentDate) {
          remainingTime = expirationTime - currentDate; // Calculate remaining time
        }
      }
  
      const newDuration = durationWeeks * 7 * 24 * 60 * 60 * 1000; // Convert weeks to milliseconds
      const newExpiration = new Date(currentDate + newDuration + remainingTime);
  
      // Update the membership fields
      membership.membership_class = newMembershipClass;
      membership.mappi_balance += mappiAllowance;
      membership.membership_expiration = newExpiration;
  
      await membership.save();
  
      res.status(200).json({
        membership_class: membership.membership_class,
        mappi_balance: membership.mappi_balance,
        membership_expiration: membership.membership_expiration,
      });
    } catch (error) {
      console.error("Error upgrading membership:", error);
      res.status(500).json({ message: "Failed to upgrade membership" });
    }
  };
  
  export const useMappi = async (req: Request, res: Response) => {
    const { user_id } = req.body;
  
    try {
      // Find the user's membership record
      const membership = await Membership.findOne({ user_id });
  
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
  
      if (membership.mappi_balance <= 0) {
        return res.status(400).json({ message: "Insufficient mappi balance" });
      }
  
      // Deduct one mappi and increment used-to-date counter
      membership.mappi_balance -= 1;
      membership.mappi_used_to_date += 1;
  
      await membership.save();
  
      res.status(200).json({ mappi_balance: membership.mappi_balance });
    } catch (error) {
      console.error("Error using mappi:", error);
      res.status(500).json({ message: "Failed to deduct mappi" });
    }
  };
  