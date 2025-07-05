import schedule from "node-schedule";
// import { runSanctionBot } from "./jobs/sanctionBot.job";
import logger from "../config/loggingConfig";
import processNextJob from "./jobs/a2uJobWorker";

export const scheduleCronJobs = () => {
  logger.info("Initializing scheduled cron jobs...");

  // Run the Sanction Bot job daily at 22:00 UTC
  // const sanctionJobTime = '0 0 22 * * *';

  // Drain A2U payment queue every 5 min
  const a2uPaymentJobTime = '0 */5 * * * *'; // Every 5 minutes

  schedule.scheduleJob(a2uPaymentJobTime, async () => {
    logger.info('🕒 A2U payment worker job triggered at 5min.');

    try {
      // await runSanctionBot();
      await processNextJob();
      logger.info("✅ A2U payment worker job completed successfully.");
      // logger.info("✅ Sanction Bot job completed successfully.");
    } catch (error) {
      logger.error("❌ A2U payment worker job failed:", error);
    }
  });

  logger.info("✅ All cron jobs have been scheduled.");
};
