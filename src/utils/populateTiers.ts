import mongoose from "mongoose";
import Tier from "../models/Tiers";
import dotenv from "dotenv";

dotenv.config();

const populateTiers = async () => {
    await mongoose.connect("mongodb+srv://mapofpi:mapofpi@mapofpi.vibqtx2.mongodb.net/map-of-pi?retryWrites=true&w=majority");
  
    const tiers = [
      {
        class: "Casual",
        mappiAllowance: 0,
        durationWeeks: 0,
        cost: 0,
        badge: "None",
        priorityLevel: 1,
      },
      {
        class: "Member",
        mappiAllowance: 5,
        durationWeeks: 2,
        cost: 0.5,
        badge: "White tick (green)",
        priorityLevel: 2,
      },
      {
        class: "Green",
        mappiAllowance: 20,
        durationWeeks: 4,
        cost: 1.5,
        badge: "Green tick (gold)",
        priorityLevel: 3,
      },
      {
        class: "Gold",
        mappiAllowance: 100,
        durationWeeks: 10,
        cost: 5,
        badge: "Gold tick (green)",
        priorityLevel: 4,
      },
      {
        class: "Double Gold",
        mappiAllowance: 400,
        durationWeeks: 20,
        cost: 10,
        badge: "Double gold tick (green)",
        priorityLevel: 5,
      },
      {
        class: "Triple Gold",
        mappiAllowance: 2000,
        durationWeeks: 50,
        cost: 20,
        badge: "Triple gold tick (green)",
        priorityLevel: 6,
      },
    ];
  
    await Tier.insertMany(tiers);
    console.log("Tiers inserted successfully!");
  
    mongoose.connection.close();
  };
  
  populateTiers().catch((error) => {
    console.error("Error populating tiers:", error);
    mongoose.connection.close();
  });