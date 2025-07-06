import A2UPaymentQueue, { A2U_STATUS } from "../../models/A2UPaymentQueue";
import { createA2UPayment } from "../../services/payment.service";
import logger from "../../config/loggingConfig";

const MAX_ATTEMPT = 3;

/* Helper Functions */
async function claimNextJob() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return A2UPaymentQueue.findOneAndUpdate(
    {
      $or: [
        { status: A2U_STATUS.PENDING },
        { status: A2U_STATUS.FAILED },
        {
          status: A2U_STATUS.BATCHING,
          last_a2u_date: { $lte: threeDaysAgo },
        },
      ],
      attempts: { $lt: MAX_ATTEMPT },
    },
    {
      status: A2U_STATUS.PROCESSING,
      $inc: { attempts: 1 },
      updatedAt: new Date(),
    },
    {
      sort: { updatedAt: 1 },
      new: true,
    }
  );
}

async function markJobSuccess(jobId: string) {
  await A2UPaymentQueue.findByIdAndUpdate(jobId, {
    status: A2U_STATUS.COMPLETED,
    updatedAt: new Date(),
    last_a2u_date: new Date(),
    last_error: null,
  });
}

async function markJobFailure(jobId: string, attempts: number, error: any) {
  const willRetry = attempts < MAX_ATTEMPT;
  await A2UPaymentQueue.findByIdAndUpdate(jobId, {
    status: willRetry ? A2U_STATUS.PENDING : A2U_STATUS.FAILED,
    last_error: error.message,
    updatedAt: new Date(),
  });

  logger.error(`[✘] A2U payment failed: ${error.message}`);
  if (!willRetry) {
    logger.error(`[⚠️] Job permanently failed after ${attempts} attempts.`);
  }
}

async function runA2UPaymentQueueWorker(): Promise<void> {
  const job = await claimNextJob();
  if (!job) {
    logger.info("No eligible A2U Payment Queue job instance found.");
    return;
  }

  const { sellerPiUid, amount, xRef_ids, _id, attempts } = job;

  logger.info(`[→] Attempt ${attempts}/${MAX_ATTEMPT} for ${sellerPiUid}`);

  try {
    await createA2UPayment({
      sellerPiUid,
      amount: amount.toString(),
      memo: "A2U payment",
      xRefIds: xRef_ids,
    });

    await markJobSuccess(_id as string);
    logger.info(`[✔] A2U payment completed for ${sellerPiUid}`);
  } catch (error: any) {
    await markJobFailure(_id as string, attempts, error);
  }
}

export default runA2UPaymentQueueWorker;