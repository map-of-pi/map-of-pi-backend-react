import dotenv from "dotenv";

import "./config/sentryConnection";
import logger from "./config/loggingConfig";
import { connectDB } from "./config/dbConnection";
import app from "./utils/app";
import { env } from "./utils/env";

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
  } catch (error: any) {
    // Log any errors that occur during server setup
    logger.error(`Server failed to initiate: ${error.message}`);
  }
};

// Start the server setup process
startServer();

export default app;
