import mongoose from "mongoose";
import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    // Only log the MongoDB URL in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.log("Connecting to MongoDB with URL:", env.MONGODB_URL);
    }
    await mongoose.connect(env.MONGODB_URL);
    console.log("Successful connection to MongoDB");
  } catch (error: any) {
    console.log("Failed connection to MongoDB:", error.message);
  }
};
