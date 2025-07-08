import A2UPaymentQueue from "../../models/A2UPaymentQueue";
import { A2UPaymentStatus } from "../../models/enums/a2uPaymentStatus";
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
        { status: A2UPaymentStatus.Pending },
        { status: A2UPaymentStatus.Failed },
        {
          status: A2UPaymentStatus.Batching,
          last_a2u_payout_date: { $lte: threeDaysAgo },
        },
      ],
      num_retries: { $lt: MAX_ATTEMPT },
    },
    {
      status: A2UPaymentStatus.Processing,
      $inc: { num_retries: 1 },
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
    status: A2UPaymentStatus.Completed,
    updatedAt: new Date(),
    last_a2u_payout_date: new Date(),
    last_error: null,
  });
}

async function markJobFailure(jobId: string, attempts: number, error: any) {
  const willRetry = attempts < MAX_ATTEMPT;
  await A2UPaymentQueue.findByIdAndUpdate(jobId, {
    status: willRetry ? A2UPaymentStatus.Pending : A2UPaymentStatus.Failed,
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

  const { payee_pi_uid: sellerPiUid, amount, xref_ids: xRef_ids, _id, num_retries: attempts } = job;

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