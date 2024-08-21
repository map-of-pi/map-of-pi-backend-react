import mongoose from "mongoose";

import logger from "./loggingConfig";
import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    // Only log the MongoDB URL in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Connecting to MongoDB with URL: ${env.MONGODB_URL}`);
    }
    await mongoose.connect(env.MONGODB_URL);
    logger.info("Successful connection to MongoDB.");
  } catch (error: any) {
    logger.error(`Failed connection to MongoDB: ${error.message}`);
  }
};
