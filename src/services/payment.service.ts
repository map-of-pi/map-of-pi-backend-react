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
} from "../types";
import logger from "../config/loggingConfig";

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

export const createOrUpdatePaymentCrossReference = async (
  orderId: string, 
  refData: U2URefDataType
): Promise<IPaymentCrossReference> => {
  try {
    const existingRef = await PaymentCrossReference.findOne({ order_id: orderId }).exec();

    if (existingRef) {
      // Update existing reference and return the updated document
      const updatedRef = await PaymentCrossReference.findOneAndUpdate(
        { order_id: orderId },
        {
          a2u_payment_id: refData.a2uPaymentId,
          a2u_completed_at: new Date(),
          u2u_status: refData.u2uStatus
        },
        { new: true }
      ).exec();

      if (!updatedRef) {
        logger.error(`Failed to update Payment xRef for orderID ${ orderId }`);
        throw new Error('Failed to update Payment xRef');
      }
      return updatedRef;
    }

    // Create a new reference if none exists
    const newRef = new PaymentCrossReference({
      order_id: orderId,
      u2a_payment_id: refData.u2aPaymentId,
      u2a_completed_at: new Date(),
      a2u_payment_id: null
    });

    return await newRef.save();

  } catch (error: any) {
    logger.error(`Failed to create/ update Payment xRef for orderID ${ orderId }: ${ error.message }`);
    throw error;
  }
};

export const createA2UPayment = async (a2uPaymentData: A2UPaymentDataType): Promise<IPayment | null> => {
  try {
    /* Step 1: Subtract gas fee from original amount to calculate net transfer payment amount */
    const gasFee = 0.01;
    const newAmount = parseFloat(a2uPaymentData.amount) - gasFee;
    logger.debug('Adjusted A2U payment amount: ', { newAmount });
    if (newAmount <= 0) {
      logger.error(`Invalid A2U payment amount ${ newAmount }; must be > 0 after gas fee deduction`);
      throw new Error('Invalid A2U payment amount');
    }

    /* Step 2: Get seller's Pi UID using the seller's _id field */
    const result = await Seller.findById(a2uPaymentData.sellerId)
    .select('seller_id -_id')
    .exec();

    if (!result?.seller_id) {
      logger.error(`Failed to find seller with ID ${ a2uPaymentData.sellerId }`);
      throw new Error('Failed to find seller; no record found');
    }

    /* Step 3: Create a Pi blockchain payment request using seller's Pi UID */
    const a2uData = {
      amount: newAmount,
      memo: "A2U payment",
      metadata: { direction: "A2U" },
      uid: result?.seller_id as string,
    };

    const paymentId = await pi.createPayment(a2uData);
    logger.debug('Payment ID: ', { paymentId });
    if (!paymentId) {
      logger.error(`Failed to create A2U Pi payment for UID ${ result.seller_id }`);
      throw new Error('Failed to create A2U Pi payment');
    }

    /* Step 4: Save the new A2U payment in the DB collection */
    const newPayment = await createPayment({
      piPaymentId: paymentId,
      userId: a2uPaymentData.buyerId as string,
      amount: newAmount.toString(),
      memo: "A2U payment",
      paymentType: a2uPaymentData.paymentType
    });
    logger.info('New A2U payment record created');
    if (!newPayment) {
      logger.error(`Failed to create A2U payment DB record with Payment ID ${ paymentId }`);
      throw new Error('Failed to create A2U payment DB record');
    }

    /* Step 5: Submit the Pi payment to finalize the blockchain transaction */
    const txid = await pi.submitPayment(paymentId);
    if (!txid) {
      logger.error(`Failed to submit A2U Pi payment with Payment ID ${ paymentId }`);
      throw new Error('Failed to submit A2U Pi payment');
    }
    logger.info('Transaction ID: ', { txid });

    /* Step 6: Mark the payment record as completed */
    const updatedPayment = await completePayment(paymentId, txid);
    if (!updatedPayment) {
      logger.error(`Failed to complete A2U payment DB record with Payment ID ${ paymentId } + Txn ID ${ txid }`);
      throw new Error('Failed to complete A2U payment DB record');
    }
    logger.info('Marked A2U payment record as completed');

    /* Step 7: Update the Payment xRef with A2U completion status */
    const u2uRefData = {
      u2uStatus: U2UPaymentStatus.A2UCompleted,
      a2uPaymentId: updatedPayment?._id as string,
    }
    const u2uRef = await createOrUpdatePaymentCrossReference(a2uPaymentData.orderId, u2uRefData);
    logger.info('Created/ updated Payment xRef record');
    if (!u2uRef) {
      logger.error(`Failed to create/ update Payment xRef with A2U Payment ID ${ updatedPayment?._id }`);
      throw new Error('Failed to create/ update Payment xRef with A2U payment data');
    }

    /* Step 8: Mark the payment as complete in the Pi blockchain (final confirmation) */
    const completedPiPayment = await pi.completePayment(paymentId, txid);
    if (!completedPiPayment) {
      logger.error(`Failed to complete A2U Pi payment with Payment ID ${ paymentId } + Txn ID ${ txid }`);
      throw new Error('Failed to complete A2U Pi payment transaction');
    }

    logger.info(`A2U payment process completed successfully for Order ID ${ a2uPaymentData.orderId }`);
    return updatedPayment;

  } catch (error) {
    logger.error(`Failed to create A2U payment for Order ID ${ a2uPaymentData.orderId }:`, error);
    return null;
  }
};

export const getPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const existingPayment = await Payment.findOne({ pi_payment_id: piPaymentId });
    if (!existingPayment) {
      logger.warn(`Failed to get payment; no record found for piPaymentID ${ piPaymentId }`);
      return null;
    }
    return existingPayment;

  } catch (error: any) {
    logger.error(`Failed to get payment for piPaymentID ${ piPaymentId }: ${ error.messsage }`);
    throw error;
  }
};

export const cancelPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const cancelledPayment = await Payment.findOneAndUpdate(
      { pi_payment_id: piPaymentId }, 
      { $set: { cancelled: true, paid: false } }, 
      { new:true }
    ).exec();

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