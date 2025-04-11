import { runSanctionBot } from "./jobs/sanctionBot.job";
import logger from "../config/loggingConfig";

const schedule = require("node-schedule");

export const scheduleCronJobs = () => {
  logger.info("Initializing scheduled cron jobs...");

  // Schedule the Sanction Bot cron job to run daily at 22:00 UTC using node-schedule.
  schedule.scheduleJob('0 22 * * * *', async () => {
    logger.info('Scheduled job triggered at 22:00 UTC.');
    try {
      await runSanctionBot();
      logger.info("Sanction Bot cron job finished execution.");
    } catch (error) {
      logger.error("Sanction Bot cron job failed:", error);
    }
  });

  logger.info("All scheduled cron jobs initialized.");
};
