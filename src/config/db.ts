import mongoose from "mongoose";
import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URL);
    console.log("connected to db")
  } catch (error: any) {
    console.log(error.message);
    process.exit(1);
    mongoose.disconnect();
    return;
  }
};
