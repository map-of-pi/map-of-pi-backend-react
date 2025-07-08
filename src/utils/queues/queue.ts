
import logger from "../../config/loggingConfig";
import A2UPaymentQueue from "../../models/A2UPaymentQueue";
import Seller from "../../models/Seller";

const GAS_FEE = 0.01;

const batchSellerRevenue = async (
  xRefId: string,
  sellerPiUid: string,
  amount: string,
): Promise<void> => {
  try {
    const onQueuePayment = await A2UPaymentQueue.findOne({ payee_pi_uid: sellerPiUid, status:"batching", last_a2u_payout_date: null }).exec();
    if (!onQueuePayment) {
      const newAmount = parseFloat(amount) - GAS_FEE;
      await A2UPaymentQueue.create({
        xref_ids: [xRefId],
        payee_pi_uid: sellerPiUid,
        amount: newAmount.toFixed(4),
        status: "batching",
        memo: "Map of Pi Payment for Order",
      });
      logger.info("new payment added to queue for seller with ID: ", sellerPiUid)
      return;
    }

    const updatedQueue = await A2UPaymentQueue.findOneAndUpdate(
      { payee_pi_uid: sellerPiUid, status:"batching", last_a2u_payout_date: null },
      {
        $inc: { amount: parseFloat(amount) },
        $push: { xref_ids: xRefId },
      },
      { new: true }
    ).exec();
   
    if (!updatedQueue) {
      logger.error(`Failed to update payment queue for seller: ${sellerPiUid}`);
      throw new Error(`Failed to update payment queue for seller: ${sellerPiUid}`);
    }

    logger.info(`Updated payment queue for seller: ${sellerPiUid}, new amount: ${updatedQueue.amount}`);
    return

  } catch (error:any) {
    logger.error("failed to enque payment")
  }

}

export const enqueuePayment = async (
  xRefId: string,
  sellerId: string,
  amount: string,
  memo:string
) => {
  try {
    // check if seller gas saver is on
    const seller = await Seller.findById( sellerId ).lean().exec();
    
    // check and compute seller revenue for gas saver
    if (seller?.gas_saver) {
      batchSellerRevenue(xRefId, seller.seller_id, amount);
      return
    }
    const newAmount = parseFloat(amount) - GAS_FEE;
    await A2UPaymentQueue.create({
      xref_ids: [xRefId],
      payee_pi_uid: seller?.seller_id,
      amount: newAmount.toFixed(4),
      status: "pending",
      memo: memo,
    });
    logger.info("new payment added to queue for seller with ID: ", {sellerId})
    return;

  }catch(error:any){

  }
}