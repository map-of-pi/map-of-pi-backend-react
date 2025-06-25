
import logger from "../../config/loggingConfig";
import { gasSaver } from "../../helpers/gasSaver";
import { createA2UPayment } from "../../services/payment.service";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function drainQueue(): Promise<void> {
  try {
    const paymentList = await gasSaver();
    const IS_EMPTY_LIST = paymentList.length === 0;
    let delay = 10000; // 3 second delay

    if (IS_EMPTY_LIST) {
      logger.info("No payments to process in the queue.");
      delay = 60000 * 60 * 60 * 4; // 4 hours delay
    }

    for (const payment of paymentList) {
      await createA2UPayment({
        sellerId: payment.sellerPiUid,
        amount: payment.amount,
        xRefIds: payment.xRef,
        memo: "A2U payment for checkout",

      });

      await sleep(delay);
    }


  }catch (error) {
    logger.error('Failed to drain queue:', error);
    throw error;
  }
}