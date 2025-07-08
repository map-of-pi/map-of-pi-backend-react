import dotenv from "dotenv";

import { 
  scheduleA2UPaymentQueueJob, 
  scheduleSanctionSellerJob 
} from "./cron";
import "./config/sentryConnection";
import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";
import logger from "./config/loggingConfig";

dotenv.config();

const startServer = async () => {
  logger.info("Initiating server setup...");
  try {
    // Establish connection to MongoDB
    await connectDB();

    // In a non-serverless environment, start the server
    if (env.NODE_ENV !== 'production') {
      await new Promise<void>((resolve) => {
        // Start listening on the specified port
        app.listen(env.PORT, () => {
          logger.info(`Server is running on port ${env.PORT}`);
          resolve();
        });
      });
    }

    logger.info("Server setup initiated.");
  } catch (error) {
    logger.error('Server failed to initialize:', error);
  }
};

// Start the server setup process
startServer();

// Start cron jobs
scheduleA2UPaymentQueueJob();
// scheduleSanctionSellerJob();

export default app;