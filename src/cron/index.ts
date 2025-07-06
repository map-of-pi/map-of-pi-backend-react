import schedule from "node-schedule";
import runA2UPaymentQueueWorker from "./jobs/a2uPaymentQueueWorker.job";
import runSanctionSellerBot from "./jobs/sanctionSellerBot.job";
import logger from "../config/loggingConfig";

// Schedule A2U payment processing via the queue every 5 minutes
export const scheduleA2UPaymentQueueJob = () => {
  const a2uPaymentJobTime = '0 */5 * * * *'; // Every 5 minutes

  schedule.scheduleJob(a2uPaymentJobTime, async () => {
    logger.info("🕒 A2U Payment Queue Worker job triggered at 5 min. intervals.");
    try {
      await runA2UPaymentQueueWorker();
      logger.info("✅ A2U Payment Queue Worker setup successful.");
    } catch (error) {
      logger.error("❌ A2U Payment Queue Worker setup failed:", error);
    }
  });

  logger.info("✅ A2U Payment Queue Worker is scheduled.");
};

// Schedule seller sanction processing at 22:00 UTC
export const scheduleSanctionSellerJob = () => {
  const sanctionSellerJobTime = '0 0 22 * * *'; // 22:00 UTC daily

  schedule.scheduleJob(sanctionSellerJobTime, async () => {
    logger.info("🕒 Sanction Seller Bot job triggered at 22:00 UTC.");
    try {
      await runSanctionSellerBot();
      logger.info("✅ Sanction Seller Bot setup successful.");
    } catch (error) {
      logger.error("❌ Sanction Seller Bot setup failed:", error);
    }
  });

  logger.info("✅ Sanction Seller Bot is scheduled.");
};