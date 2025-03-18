import dotenv from "dotenv";

import "./config/sentryConnection";
import logger from "./config/loggingConfig";
import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";
import {runSanctionBot} from "./services/sanctionBotJob.service";
const schedule = require("node-schedule");

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

// Schedule the job to run daily at 22:00 UTC using node-schedule.
schedule.scheduleJob('0 22 * * * *', async () => {
  logger.info('Scheduled job triggered at 22:00 UTC.');
  await runSanctionBot().then(() => logger.info("Sanction Bot finished execution!"));
  logger.info('Scheduled job finished running');
});

export default app;
