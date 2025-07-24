import logger from "../../config/loggingConfig";
import A2UPaymentQueue from "../../models/A2UPaymentQueue";
import { createA2UPayment } from "../../services/payment.service";

// workers/mongodbA2UWorker.ts
async function processNextJob(): Promise<void> {
  const now = new Date();
  const MAXATTEMPT = 3

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const job = await A2UPaymentQueue.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        { status: 'failed' },
        {
          status: 'batching',
          last_a2u_date: { $lte: threeDaysAgo }
        }
      ],
      attempts: { $lt: 3 }
    },
    {
      status: 'processing',
      $inc: { attempts: 1 },
      updatedAt: new Date(),
    },
    {
      sort: { updatedAt: 1 },
      new: true,
    }
  );


  if (!job) return;

  const { sellerPiUid, amount, xRef_ids, _id, attempts, memo, last_a2u_date } = job;

  try {
    logger.info(`[→] Attempt ${attempts}/${MAXATTEMPT} for ${sellerPiUid}`);

    await createA2UPayment({
      sellerPiUid: sellerPiUid,
      amount: amount.toString(),
      memo: "A2U payment",
      xRefIds: xRef_ids
    })

    await A2UPaymentQueue.findByIdAndUpdate(_id, {
      status: 'completed',
      updatedAt: new Date(),
      last_a2u_date: new Date(),
      last_error: null,
    });

    console.log(`[✔] A2U payment completed for ${sellerPiUid}`);
  } catch (err: any) {
    
    const willRetry = attempts < MAXATTEMPT;

    await A2UPaymentQueue.findByIdAndUpdate(_id, {
      status: willRetry ? 'pending' : 'failed',
      last_error: err.message,
      updatedAt: new Date(),
    });

    logger.error(`[✘] A2U payment failed for ${sellerPiUid}: ${err.message}`);
    if (!willRetry) {
      logger.info(`[⚠️] Job permanently failed after ${attempts} attempts.`);
    }
  }
}

export default processNextJob;
