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
    logger.error(`Failed to create payment for piPaymentID ${ paymentData.piPaymentId }: ${ error }`);
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
    logger.error(`Failed to complete payment for piPaymentID ${ piPaymentId }: ${ error }`);
    throw error;
  }
};

export const createPaymentCrossReference = async (
  orderId: string,
  refData: U2URefDataType
): Promise<IPaymentCrossReference> => {
  try {
    const newRef = new PaymentCrossReference({
      order_id: orderId,
      u2a_payment_id: refData.u2aPaymentId,
      u2a_completed_at: new Date(),
      a2u_payment_id: null
    });

    return await newRef.save();
  } catch (error: any) {
    logger.error(`Failed to create Payment xRef for orderID ${ orderId }: ${ error }`);
    throw error;
  }
};

export const updatePaymentCrossReference = async (
  orderId: string,
  refData: U2URefDataType
): Promise<IPaymentCrossReference> => {
  try {
    const updatedRef = await PaymentCrossReference.findOneAndUpdate(
      { order_id: orderId },
      {
        a2u_payment_id: refData.a2uPaymentId,
        a2u_completed_at: new Date(),
        u2u_status: refData.u2uStatus
      },
      { new: true }
    ).lean().exec();

    if (!updatedRef) {
      logger.error(`Failed to update Payment xRef for orderID ${orderId}`);
      throw new Error('Failed to update Payment xRef');
    }
    return updatedRef;
  } catch (error: any) {
    logger.error(`Failed to create/ update Payment xRef for orderID ${ orderId }: ${ error }`);
    throw error;
  }
};

export const createA2UPayment = async (a2uPaymentData: A2UPaymentDataType): Promise<IPayment | null> => {
  try {
    /* Step 1: Subtract gas fee from original amount to calculate net transfer payment amount */
    const gasFee = 0.01;
    const newAmount = parseFloat(a2uPaymentData.amount) - gasFee;
    logger.info('Adjusted A2U payment amount: ', { newAmount });
    if (newAmount <= 0) {
      logger.error(`Invalid A2U payment amount ${ newAmount }; must be > 0 after gas fee deduction`);
      throw new Error('Invalid A2U payment amount');
    }

    /* Step 2: Get seller's Pi UID using the seller's _id field */
    const existingSeller = await Seller.findById(a2uPaymentData.sellerId)
      .select('seller_id -_id') // Include seller_id, exclude _id
      .exec();

    if (!existingSeller?.seller_id) {
      logger.error(`Failed to find seller with ID ${ a2uPaymentData.sellerId }`);
      throw new Error('Failed to find seller; no record found');
    }

    /* Step 3: Create a Pi blockchain payment request using seller's Pi UID */
    const a2uData = {
      amount: newAmount,
      memo: a2uPaymentData.memo,
      metadata: { direction: "A2U", orderId: a2uPaymentData.orderId, sellerId: a2uPaymentData.sellerId, buyerId: a2uPaymentData.buyerId },
      uid: existingSeller?.seller_id as string,
    };

    const paymentId = await pi.createPayment(a2uData);
    logger.debug('Payment ID: ', { paymentId });
    if (!paymentId) {
      logger.error(`Failed to create A2U Pi payment for UID ${ existingSeller.seller_id }`);
      throw new Error('Failed to create A2U Pi payment');
    }

    /* Step 4: Save the new A2U payment in the DB collection */
    const newPayment = await createPayment({
      piPaymentId: paymentId,
      userId: a2uPaymentData.buyerId as string,
      amount: newAmount.toString(),
      memo: a2uPaymentData.memo,
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
    const u2uRef = await updatePaymentCrossReference(a2uPaymentData.orderId, u2uRefData);
    if (!u2uRef) {
      logger.error(`Failed to update Payment xRef with A2U Payment ID ${ updatedPayment?._id }`);
      throw new Error('Failed to update Payment xRef with A2U payment data');
    }

    logger.info('updated Payment xRef record', u2uRef);

    /* Step 8: Mark the payment as complete in the Pi blockchain (final confirmation) */
    const completedPiPayment = await pi.completePayment(paymentId, txid);
    if (!completedPiPayment) {
      logger.error(`Failed to complete A2U Pi payment with Payment ID ${ paymentId } + Txn ID ${ txid }`);
      throw new Error('Failed to complete A2U Pi payment transaction');
    }

    logger.info(`A2U payment process completed successfully for Order ID ${ a2uPaymentData.orderId }`);
    return updatedPayment;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error(`Axios error during A2U payment: ${error}`, {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
    } else {
      logger.error(`Failed to create A2U payment for Order ID ${a2uPaymentData.orderId}:`, {
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
    const metadata = payment.metadata as { orderId: string; sellerId: string; buyerId: string };

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
      const u2uRef = await updatePaymentCrossReference(metadata?.orderId, {
        u2uStatus: U2UPaymentStatus.A2UCompleted,
        a2uPaymentId: updatedPayment._id as string,
      });

      if (!u2uRef) {
        throw new Error(`Failed to update payment cross reference for order ${metadata.orderId}`);
      }

      logger.info('Updated U2U reference record', u2uRef);

      // Final confirmation with Pi network
      const completedPiPayment = await pi.completePayment(piPaymentId, txid);
      if (!completedPiPayment) {
        throw new Error(`Failed to confirm Pi payment on blockchain for ${piPaymentId}`);
      }

      logger.info(`✅ A2U payment process completed for Order ID: ${metadata.orderId}`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error during A2U payment for order ${metadata.orderId || 'unknown'}: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error(`❌ Error completing server payment for Order ID ${metadata.orderId || 'unknown'}: ${error.message}`);
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
    logger.error(`Failed to get payment for piPaymentID ${ piPaymentId }: ${ error }`);
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
    logger.error(`Failed to cancel payment for piPaymentID ${ piPaymentId }: ${ error }`);
    throw error;
  }
};