import mongoose from "mongoose";

import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URL);
    console.log("Successful connection to MongoDB");
  } catch (error: any) {
    console.log("Failed connection to MongoDB:", error.message);
  }
};
