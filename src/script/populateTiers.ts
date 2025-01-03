import mongoose from "mongoose";
import Tier from "../models/Tiers";
import { MembershipType } from "../models/enums/memberShipType";
import dotenv from "dotenv";

dotenv.config();

const populateTiers = async () => {
  const dbURI = process.env.MONGODB_URI || "your-default-uri-here";

  await mongoose.connect(dbURI);

  const tiers = [
    {
      class: MembershipType.CASUAL,
      mappiAllowance: 0,
      durationWeeks: 0,
      cost: 0,
      badge: "None",
      priorityLevel: 1,
    },
    {
      class: MembershipType.MEMBER,
      mappiAllowance: 5,
      durationWeeks: 2,
      cost: 0.5,
      badge: "White tick (green)",
      priorityLevel: 2,
    },
    {
      class: MembershipType.GREEN,
      mappiAllowance: 20,
      durationWeeks: 4,
      cost: 1.5,
      badge: "Green tick (gold)",
      priorityLevel: 3,
    },
    {
      class: MembershipType.GOLD,
      mappiAllowance: 100,
      durationWeeks: 10,
      cost: 5,
      badge: "Gold tick (green)",
      priorityLevel: 4,
    },
    {
      class: MembershipType.DOUBLE_GOLD,
      mappiAllowance: 400,
      durationWeeks: 20,
      cost: 10,
      badge: "Double gold tick (green)",
      priorityLevel: 5,
    },
    {
      class: MembershipType.TRIPLE_GOLD,
      mappiAllowance: 2000,
      durationWeeks: 50,
      cost: 20,
      badge: "Triple gold tick (green)",
      priorityLevel: 6,
    },
  ];

  const existingTiers = await Tier.find();
  if (existingTiers.length > 0) {
    console.log("Tiers already populated. Skipping insert.");
    mongoose.connection.close();
    return;
  }

  await Tier.insertMany(tiers);
  console.log("Tiers inserted successfully!");
  mongoose.connection.close();
};

populateTiers().catch((error) => {
  console.error("Error populating tiers:", error.message);
  mongoose.connection.close();
});
