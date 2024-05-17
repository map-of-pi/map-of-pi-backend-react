import mongoose from "mongoose";
import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URL);
  } catch (error: any) {
    console.log(error.message);
    return;
  }
};
