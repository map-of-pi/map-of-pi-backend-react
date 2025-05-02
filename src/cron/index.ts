import schedule from "node-schedule";
import { runSanctionBot } from "./jobs/sanctionBot.job";
import logger from "../config/loggingConfig";

export const scheduleCronJobs = () => {
  logger.info("Initializing scheduled cron jobs...");

  // Run the Sanction Bot job daily at 22:00 UTC
  const sanctionJobTime = '0 0 22 * * *';

  schedule.scheduleJob(sanctionJobTime, async () => {
    logger.info('🕒 Sanction Bot job triggered (22:00 UTC).');

    try {
      await runSanctionBot();
      logger.info("✅ Sanction Bot job completed successfully.");
    } catch (error) {
      logger.error("❌ Sanction Bot job failed:", error);
    }
  });

  logger.info("✅ All cron jobs have been scheduled.");
};
