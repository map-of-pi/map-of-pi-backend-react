import Membership from "../models/Membership";
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";

export const getMembershipStatus = async (req: Request, res: Response) => {
  const piUid = req.params.user_id; // This is the pi_uid being passed in

  try {
    // Validate input
    if (!piUid || typeof piUid !== "string") {
      return res.status(400).json({ message: "Invalid piUid provided" });
    }

    // Step 1: Find User by pi_uid
    const user = await User.findOne({ pi_uid: piUid });
    if (!user) {
      console.warn(`User not found for pi_uid: ${piUid}`);
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id; // Extract the user's _id (ObjectId)

    // Step 2: Find Membership by user_id
    const membership = await Membership.findOne({ user_id: userId });
    if (!membership) {
      console.warn(`Membership not found for user_id: ${userId}`);
      return res.status(404).json({ message: "Membership not found" });
    }

    // Respond with membership details
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
    // Validate input
    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ message: "Invalid piUid provided" });
    }

    const user = await User.findOne({ pi_uid: user_id }); // Assume user_id is pi_uid here
    if (!user) {
      console.warn(`User not found for pi_uid: ${user_id}`);
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id; // Extract ObjectId
    const membership = await Membership.findOne({ user_id: userId });
    if (!membership) {
      console.warn(`Membership not found for user_id: ${userId}`);
      return res.status(404).json({ message: "Membership not found" });
    }

    const MILLISECONDS_IN_A_WEEK = 7 * 24 * 60 * 60 * 1000;
    const currentDate = Date.now();
    const remainingTime =
      membership.membership_expiration && membership.membership_expiration.getTime() > currentDate
        ? membership.membership_expiration.getTime() - currentDate
        : 0;
    const newExpiration = new Date(currentDate + durationWeeks * MILLISECONDS_IN_A_WEEK + remainingTime);

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
  const { user_id: piUid } = req.body;

  try {
    // Validate input
    if (!piUid || typeof piUid !== "string") {
      return res.status(400).json({ message: "Invalid piUid provided" });
    }

    const user = await User.findOne({ pi_uid: piUid });
    if (!user) {
      console.warn(`User not found for pi_uid: ${piUid}`);
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id; // Extract ObjectId
    const membership = await Membership.findOne({ user_id: userId });
    if (!membership) {
      console.warn(`Membership not found for user_id: ${userId}`);
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.mappi_balance <= 0) {
      return res.status(400).json({ message: "Insufficient mappi balance" });
    }

    membership.mappi_balance -= 1;
    membership.mappi_used_to_date += 1;

    await membership.save();

    res.status(200).json({ mappi_balance: membership.mappi_balance });
  } catch (error) {
    console.error("Error using mappi:", error);
    res.status(500).json({ message: "Failed to deduct mappi" });
  }
};
