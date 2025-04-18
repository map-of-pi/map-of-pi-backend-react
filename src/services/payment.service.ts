import logger from "../config/loggingConfig";
import Payment from "../models/Payment";
import { IPayment, IPaymentCrossReference } from "../types";
import pi from "../config/platformAPIclient";
import { PaymentType } from "../models/enums/paymentType";
import PaymentCrossReference from "../models/PaymentCrossReference";
import { U2UPaymentStatus } from "../models/enums/u2uPaymentStatus";
import Seller from "../models/Seller";

interface NewPayment {
  piPaymentId: string,
  userId: string,
  memo:  string,
  amount: string,
  paymentType: PaymentType
};

export const createPayment = async ( paymentData: NewPayment ): Promise<IPayment> => {
  try {
    
    const payment = new Payment({
      pi_payment_id: paymentData.piPaymentId,
      user_id: paymentData.userId,
      amount: paymentData.amount,
      paid: false,
      memo: paymentData.memo,
      payment_type: paymentData.paymentType,
      cancelled: false,
    });
    const newPayment = await payment.save();

    if (!newPayment){
      logger.error("Unable to create payment record");
      throw new Error("Unable to create payment record");
    }
    return newPayment;

  } catch (error:any) {
    logger.error("Error creating payment record: ", error);
    throw new Error("Error creating payment record: " + error.message);
  }
}

export const completePayment = async (piPaymentId: string, txid: string): Promise<IPayment> => {
  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { pi_payment_id: piPaymentId }, 
      { $set: { txid, paid: true } }, 
      {new: true}
    ).exec();

    if (!updatedPayment) {
      logger.error("unable to complete payment record");
      throw new Error("Unable to complete payment record");
    }
    return updatedPayment;
    
  } catch (error:any) {
    logger.error('error occured while updating payment: ', error.message);
    throw new Error("Error occurred while completing payment: " + error.message);
  }
  
} 
interface U2URefDataType {
  u2aPaymentId?: string,
  u2uStatus: U2UPaymentStatus,
  a2uPaymentId: string | null,
}
export const createOrUpdateU2UReference = async (orderId: string, refData: U2URefDataType): Promise<IPaymentCrossReference> => {
  try {
    const existRef = await PaymentCrossReference.findOne({ order_id: orderId }).exec();

    if (existRef) {
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
        logger.error("Failed to update existing U2U reference");
        throw new Error("Failed to update existing U2U reference");
      }

      return updatedRef;
    }

    // Create a new reference if none exists
    const ref = new PaymentCrossReference({
      order_id: orderId,
      u2a_payment_id: refData.u2aPaymentId,
      u2a_completed_at: new Date(),
      a2u_payment_id: null
    });
    const newRef = await ref.save();

    if (!newRef) {
      logger.error("Unable to create U2U reference");
      throw new Error("Unable to create U2U reference");
    }

    return newRef;
  } catch (error) {
    logger.error("Error creating or updating U2U reference: ", error);
    throw new Error("Error creating or updating U2U reference");;
  }
};

interface A2UPaymentDataType {
  sellerId: string,
  amount: string,
  buyerId: string,
  paymentType: PaymentType,
  orderId: string
}
export const createA2UPayment = async ( a2uPaymentData:A2UPaymentDataType ): Promise<IPayment | null> => {
  try {
    // Calculate the adjusted amount after deducting the gas fee
    const gasFee = 0.01;
    const newAmount = parseFloat(a2uPaymentData.amount) - gasFee;
    logger.warn("Adjusted Amount: ", {newAmount});
    if (newAmount <= 0) {
      throw new Error("Invalid payment amount: Must be greater than 0 after gas fee deduction");
    }

    // get seller pi_uid
    const seller_pi_uid = await Seller.findById(a2uPaymentData.sellerId).select("seller_id -_id").exec();
    logger.warn("Seller Pi UID: ", {seller_pi_uid});

    // Prepare data for Pi payment
    const a2uData = {
      amount: newAmount,
      memo: "A2U payment",
      metadata: { direction: "A2U" },
      uid: seller_pi_uid?.seller_id as string,
    };

    // Step 1: Create Pi blockchain payment
    const paymentId = await pi.createPayment(a2uData);
    logger.warn("Payment ID: ", {paymentId});
    if (!paymentId) {
      throw new Error("Failed to create Pi payment");
    }

    // Step 2: Create new A2U payment record
    const newPayment = await createPayment({
      piPaymentId: paymentId,
      userId: a2uPaymentData.buyerId as string,
      amount: newAmount.toString(),
      memo: "A2U payment",
      paymentType: a2uPaymentData.paymentType
    });
    logger.info("New A2U payment record created");
    if (!newPayment) {
      throw new Error("Failed to create new A2U payment record");
    }

    // Step 3: Submit the Pi payment
    const txid = await pi.submitPayment(paymentId as string);
    if (!txid) {
      throw new Error("Failed to submit A2U Pi payment");
    }
    logger.info("Transaction ID: ", {txid});

    // Step 4: Update the payment record as completed
    const updatedPayment = await completePayment(paymentId, txid);
    if (!updatedPayment) {
      throw new Error("Failed to update payment record as completed");
    }
    logger.info("Updated Payment record ");

    // Step 5: Update the U2U reference with the A2U payment details
    const u2uRefData = {
      u2uStatus: U2UPaymentStatus.A2UCompleted,
      a2uPaymentId: updatedPayment?._id as string,
    }
    const u2uRef = await createOrUpdateU2UReference(a2uPaymentData.orderId, u2uRefData)
    logger.info("updated U2U Ref record ")
    if (!u2uRef) {
      throw new Error("Failed to update U2U reference with A2U payment details");
    }

    // Step 6: Mark payment as completed on blockchain
    const completedPiPayment = await pi.completePayment(paymentId, txid);
    if (!completedPiPayment) {
      throw new Error("Failed to complete Pi payment");
    }

    return updatedPayment;
  } catch (error: any) {
    logger.error("Error creating A2U payment: ", {error});
    return null;
  }
};


// get existing payment record using pi_payment_id
export const getPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const incompletePayment = await Payment.findOne({ pi_payment_id: piPaymentId });
    
    if (!incompletePayment) {
      logger.warn("payment record not found")
      return null;
    }
    return incompletePayment

  }catch (error:any) {
    logger.error("Error getting payment record: ", error);
    throw new Error("Error getting payment record: " + error.message);
  }
}


export const cancelPayment = async (piPaymentId: string): Promise<IPayment | null> => {
  try {
    const cancelledPayment = await Payment.findOneAndUpdate({ pi_payment_id: piPaymentId }, { $set: { cancelled: true, paid: false } }, {new:true}).exec();    
    if (!cancelledPayment) {
      logger.error("Failed to mark payment as cancelled");
      throw new Error("Failed to mark payment as cancelled");
    }
    return cancelledPayment;

  } catch (error:any) {
    logger.error("Error cancelling payment: ", error);
    throw new Error("Error cancelling payment: " + error.message);
  }
}