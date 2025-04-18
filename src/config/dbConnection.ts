import mongoose from "mongoose";

import logger from "./loggingConfig";
import { env } from "../utils/env";

export const connectDB = async () => {
  try {
    // Only log the MongoDB URL in non-production environments
    if (env.NODE_ENV !== 'production') {
      logger.info(`Connecting to MongoDB with URL: ${env.MONGODB_URL}`);
    }
    await mongoose.connect(env.MONGODB_URL, {
      minPoolSize: env.MONGODB_MIN_POOL_SIZE,
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE
    });
    logger.info("Successful connection to MongoDB.");
  } catch (error) {
    logger.error('Failed connection to MongoDB:', error);
  }
};
