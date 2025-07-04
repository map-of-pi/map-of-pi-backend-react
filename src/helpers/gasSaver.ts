import PaymentCrossReference from '../models/PaymentCrossReference';
import { U2UPaymentStatus } from '../models/enums/u2uPaymentStatus';
import Order from '../models/Order';
import pi from '../config/platformAPIclient';
import logger from '../config/loggingConfig';
import Payment from '../models/Payment';
import { PaymentDirection } from '../models/enums/paymentDirection';
import Seller from '../models/Seller';
import { IOrder } from '../types';
import { createA2UPayment, updatePaymentCrossReference } from '../services/payment.service';
import path from 'path';

const GAS_FEE = 0.01;
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

const computeRevenue = (
  xRefId: string,
  sellerPiUid: string,
  amount: string,
  paymentList: { xRef: string[]; sellerPiUid: string; amount: string }[]
): void => {
  const existing = paymentList.find(p => p.sellerPiUid === sellerPiUid);
  if (existing) {
    existing.amount = (
      parseFloat(existing.amount) + parseFloat(amount)
    ).toFixed(3);
    existing.xRef.push(xRefId);
  } else {
    paymentList.push({
      xRef: [xRefId],
      sellerPiUid,
      amount: parseFloat(amount).toFixed(2),
    });
  }
};

export const gasSaver = async (): Promise<{ xRef: string[]; sellerPiUid: string; amount: string }[]> => {
  try {
    const paymentList: { xRef: string[]; sellerPiUid: string; amount: string }[] = [];

    // 1️⃣ Fetch all U2ACompleted or A2UFailed refs
    const xRefs = await PaymentCrossReference.find({
      a2u_payment_id: null,
      $or: [
        { u2u_status: U2UPaymentStatus.U2ACompleted },
        { u2u_status: U2UPaymentStatus.A2UFailed }
      ]
    })
    .populate<{ order_id: {_id:String, total_amount:string, seller_id: {seller_id:string, gas_saver:boolean}} }>({
      path: 'order_id',
      select: '_id total_amount seller_id',
      populate: {
        path: 'seller_id',
        model: 'Seller', // ensure this matches your actual Seller model name
        select: 'seller_id gas_saver'
      }
    })
    .lean()
    .exec();

    logger.info(`Fetched ${xRefs.length} payment cross-references for gas saver processing`);

    // 2️⃣ Get latest A2U per seller via aggregation (1 DB query)
    const latestA2uPerSeller = await PaymentCrossReference.aggregate([
      { $match: { a2u_payment_id: { $ne: null } } },
      {
        $group: {
          _id: '$seller_id',
          latestDate: { $max: '$a2u_completed_at' }
        }
      }
    ]);

    const sellerLatestMap = new Map<string, Date>();
    for (const entry of latestA2uPerSeller) {
      sellerLatestMap.set(entry._id?.toString(), entry.latestDate);
    }

    // 2️⃣ Build the batched paymentList
    for (const ref of xRefs) {
      const order = ref.order_id;      
      const seller = order?.seller_id

      if (!order || !seller || !seller.seller_id) {
        logger.warn(`Missing order/seller for ref ${ref._id}`);
        continue;
      }

      const orderId = order._id.toString();
      const sellerPiUid = seller.seller_id;
      const isGasSaver = seller.gas_saver;

      // query to get latest A2U date for each unique seller_id
      const latestA2uDate = sellerLatestMap.get(sellerPiUid) || ref.u2a_completed_at;
      const isWithin3Days = latestA2uDate && new Date(latestA2uDate) >= THREE_DAYS_AGO;

      const netAmount = parseFloat(order.total_amount.toString()) - GAS_FEE;
      if (netAmount <= 0) {
        logger.warn(`Order ${order._id.toString()} net amount is less than or equal to zero; skipping.`);
        continue;
      }

      // apply gasSaver logic
      if (isGasSaver) {

        if (isWithin3Days) {         
          computeRevenue(ref._id.toString(), sellerPiUid, netAmount.toFixed(4), paymentList);
        } else {
          logger.info(`Skipping gas saver for seller ${sellerPiUid} due to recent A2U activity.`);
          continue;
        }
      
      } else {
        paymentList.push({
          xRef: [ref._id.toString()],
          sellerPiUid: sellerPiUid,
          amount: netAmount.toFixed(4),
        })
      }
    }
    logger.info(`Computed ${paymentList.length} payment batches for processing`);

    return paymentList

  } catch (err: any) {
    logger.error('Error in gasSaver:', err);
    return [];
  }
};
