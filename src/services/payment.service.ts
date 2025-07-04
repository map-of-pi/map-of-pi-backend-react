import axios from "axios";
import pi from "../config/platformAPIclient";
import Payment from "../models/Payment";
import PaymentCrossReference from "../models/PaymentCrossReference";
import Seller from "../models/Seller";
import { U2UPaymentStatus } from "../models/enums/u2uPaymentStatus";
import { 
  IPayment, 
  IPaymentCrossReference, 
  NewPayment, 
  U2URefDataType,
  A2UPaymentDataType,
  PaymentDTO,
} from "../types";
import logger from "../config/loggingConfig";
import { PaymentDirection } from "../models/enums/paymentDirection";
import { dir } from "console";
import { PaymentType } from "../models/enums/paymentType";

export const createPayment = async (paymentData: NewPayment): Promise<IPayment> => {
  try {    
    // Create new payment
    const payment = new Payment({
      pi_payment_id: paymentData.piPaymentId,
      user_id: paymentData.userId,
      amount: paymentData.amount,
      paid: false,
      memo: paymentData.memo,
      payment_type: paymentData.paymentType,
      cancelled: false,
    });

    return await payment.save();

  } catch (error: any) {
    logger.error(`Failed to create payment for piPaymentID ${ paymentData.piPaymentId }: ${ error.message }`);
    throw error;
  }
};

export const completePayment = async (
  piPaymentId: string, 
  txid: string
): Promise<IPayment> => {
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { pi_payment_id: piPaymentId }, 
      { $set: { txid, paid: true } }, 
      { new: true }
    ).exec();

    if (!updatedPayment) {
      logger.error(`Failed to update payment record for piPaymentID ${ piPaymentId }`);
      throw new Error('Failed to update payment');
    }
    return updatedPayment;
    
  } catch (error: any) {
    logger.error(`Failed to complete payment for piPaymentID ${ piPaymentId }: ${ error.message }`);
    throw error;
  }
};

export const createPaymentCrossReference = async (
  refData: U2URefDataType
): Promise<IPaymentCrossReference> => {
  try {
    const newRef = new PaymentCrossReference({
      order_id: refData.orderId,
      u2a_payment_id: refData.u2aPaymentId,
      u2u_status: refData.u2uStatus,
      u2a_completed_at: new Date(),
      a2u_payment_id: null
    });

    return await newRef.save();
  } catch (error: any) {
    logger.error(`Failed to create Payment xRef for orderID ${refData.orderId}: ${error.message}`);
    throw error;
  }
};

export const getxRefByOrderId = async (orderId: string) => {
  try {
    const existingXRef = await PaymentCrossReference.findOne({order_id: orderId}).lean().exec()
    return existingXRef
  } catch (error:any) {
    logger.error("Can't find xRef with id: ", orderId)
  }
}

export const updatePaymentCrossReference = async (
  xRefIds: string[],
  refData: U2URefDataType
): Promise<number> => {
  try {
    const result = await PaymentCrossReference.updateMany(
      { _id: { $in: xRefIds } },
      {
        $set: {
          u2a_payment_id: refData.u2aPaymentId,
          a2u_payment_id: refData.a2uPaymentId,
          a2u_completed_at: new Date(),
          u2u_status: refData.u2uStatus,
        },
      }
    ).exec();

    if (result.modifiedCount === 0) {
      logger.warn(`No PaymentCrossReference updated for IDs: ${xRefIds.join(', ')}`);
    } else {
      logger.info(`Updated ${result.modifiedCount} PaymentCrossReferences.`);
    }
    return result.modifiedCount;
  } catch (error: any) {
    logger.error(`Failed to update PaymentCrossReferences: ${error.message}`);
    throw error;
  }
};



export const getIncompleteServerPayments = async (): Promise<any> => {
  try {
    const serverpayments = await pi.getIncompleteServerPayments();
    if (!serverpayments || serverpayments.length === 0) { 
      logger.info('No incomplete Pi payments found on the server');
      return [];
    }
    logger.info(`Found ${ serverpayments.length } incomplete Pi payments on the server`, serverpayments);
    return serverpayments;
  } catch (error: any) {
    logger.error(`Failed to fetch incomplete Pi payments from server: ${ error.message }`);
    throw error;
  }
};

export const completeServerPayment = async (serverPayments: PaymentDTO[]): Promise<void> => {
  if (!Array.isArray(serverPayments) || serverPayments.length === 0) {
    logger.warn('No server payments to complete');
    return;
  }

  for (const payment of serverPayments) {
    let transaction = payment.transaction || null;
    const piPaymentId = payment.identifier;
    const metadata = payment.metadata as { xRefId: string; sellerId: string; buyerId: string };

    if (!piPaymentId) {
      logger.error('Missing Pi payment ID');
      continue;
    }

    try {
      let txid = transaction?.txid;

      // Submit payment if txid not yet assigned
      if (!txid) {
        txid = await pi.submitPayment(piPaymentId);
        if (!txid) {
          throw new Error(`Failed to submit Pi payment with ID ${piPaymentId}`);
        }
      }

      // Mark the payment as completed in your DB
      const updatedPayment = await completePayment(piPaymentId, txid);
      if (!updatedPayment) {
        throw new Error(`Failed to update payment DB for payment ID ${piPaymentId}`);
      }
      logger.info(`Marked A2U payment as completed for ${piPaymentId}`);

      // Update U2U payment cross reference
      const u2uRef = await updatePaymentCrossReference([metadata?.xRefId], {
        u2uStatus: U2UPaymentStatus.A2UCompleted,
        a2uPaymentId: updatedPayment._id as string,
      });

      if (!u2uRef) {
        throw new Error(`Failed to update payment cross reference for ${metadata.xRefId}`);
      }

      logger.info('Updated U2U reference record', u2uRef);

      // Final confirmation with Pi network
      const completedPiPayment = await pi.completePayment(piPaymentId, txid);
      if (!completedPiPayment) {
        throw new Error(`Failed to confirm Pi payment on blockchain for ${piPaymentId}`);
      }

      logger.info(`✅ A2U payment process completed for xRef ID: ${metadata.xRefId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error during A2U payment for xRef ${metadata.xRefId || 'unknown'}: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error(`❌ Error completing server payment for xRef ID ${metadata.xRefId || 'unknown'}: ${error.message}`);
      }
    }
  }
};


export const getPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const existingPayment = await Payment.findOne({ pi_payment_id: piPaymentId }).exec();
    if (!existingPayment) {
      logger.warn(`Failed to get payment; no record found for piPaymentID ${ piPaymentId }`);
      return null;
    }
    return existingPayment;

  } catch (error: any) {
    logger.error(`Failed to get payment for piPaymentID ${ piPaymentId }: ${ error.message }`);
    throw error;
  }
};

export const cancelPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const cancelledPayment = await Payment.findOneAndUpdate(
      { pi_payment_id: piPaymentId }, 
      { $set: { cancelled: true, paid: false } }, 
      { new:true }
    ).lean().exec();

    if (!cancelledPayment) {
      logger.error(`Failed to cancel payment record for piPaymentID ${ piPaymentId }`);
      throw new Error('Failed to cancel payment');
    }
    return cancelledPayment;

  } catch (error: any) {
    logger.error(`Failed to cancel payment for piPaymentID ${ piPaymentId }: ${ error.message }`);
    throw error;
  }
};


export const createA2UPayment = async (a2uPaymentData: A2UPaymentDataType): Promise<string | null> => {
  try {
    const a2uData = {
      amount: parseFloat(a2uPaymentData.amount),
      memo: a2uPaymentData.memo,
      metadata: { direction: "A2U", sellerId: a2uPaymentData.sellerPiUid },
      uid: a2uPaymentData.sellerPiUid as string,
    };

    const paymentId = await pi.createPayment(a2uData);
    logger.debug('Payment ID: ', { paymentId });
    if (!paymentId) {
      logger.error(`Failed to create A2U Pi payment for UID ${ a2uPaymentData.sellerPiUid }`);
      throw new Error('Failed to create A2U Pi payment');
    }

    /* Step 5: Submit the Pi payment to finalize the blockchain transaction */
    const txid = await pi.submitPayment(paymentId);
    if (!txid) {
      logger.error(`Failed to submit A2U Pi payment with Payment ID ${ paymentId }`);
      throw new Error('Failed to submit A2U Pi payment');
    }
    logger.info('Transaction ID: ', { txid });

    // get xRef for each xRefIds
    for (const refId of a2uPaymentData.xRefIds) {

      const xRef = await PaymentCrossReference.findById(refId)
      .populate<{u2a_payment_id: {memo:string}}>({path:'u2a_payment_id', model: 'Payment', select: 'memo'})
      .populate<{order_id: {seller_id:string}}>({path:'order_id', model: 'Order', select: 'seller_id'})
      .lean()
      .exec();

      const completeda2uPayment = await Payment.create({
        pi_payment_id: paymentId,
        user_id: xRef?.order_id.seller_id,
        amount: a2uPaymentData.amount,
        memo: xRef?.u2a_payment_id.memo as string,
        txid: txid,
        direction: PaymentDirection.A2U,
        payment_type: PaymentType.BuyerCheckout,
        paid: true,
        cancelled: false,
      })

      const xRefData = {
        u2uStatus: U2UPaymentStatus.A2UCompleted,
        a2uPaymentId: completeda2uPayment?._id as string,
      };

      const updatedRef = await PaymentCrossReference.findByIdAndUpdate(
        refId, 
        {
          $set: {
            a2u_payment_id: completeda2uPayment?._id as string,
            a2u_completed_at: new Date(),
            u2u_status: xRefData.u2uStatus, 
            error_message: '',
          }
        }
      ).lean()
      .exec();

      logger.info('updated Payment xRef record', updatedRef?._id.toString());

    }

    const completedPiPayment = await pi.completePayment(paymentId, txid);
    if (!completedPiPayment) {
      logger.error(`Failed to complete A2U Pi payment with Payment ID ${ paymentId } + Txn ID ${ txid }`);
      throw new Error('Failed to complete A2U Pi payment transaction');
    }

    logger.info(`A2U payment process completed successfully for xRef ID ${ a2uPaymentData.xRefIds }`);
    return paymentId;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error(`Axios error during A2U payment: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
    } else {
      logger.error(`Failed to create A2U payment for Order ID ${a2uPaymentData.xRefIds}:`, {
        message: error.message,
        stack: error.stack,
      });
    }

    // Handle cancellation of the payment if it was created but not completed
    const {incomplete_server_payments} = await getIncompleteServerPayments();
    logger.info("found incomplete server payments", incomplete_server_payments);
    if (incomplete_server_payments && incomplete_server_payments.length > 0) {
      await completeServerPayment(incomplete_server_payments);
    }
    return null;
  }
};