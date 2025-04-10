import logger from "../config/loggingConfig";
import Payment from "../models/Payment";
import { IPayment } from "../types";

export const createPayment = async (paymentData: Partial<IPayment>): Promise<IPayment | null> => {
  try {
    const payment = new Payment(paymentData);
    const newPayment = await payment.save();
    if (!newPayment){
      logger.error("Unable to create payment record");
      return null;
    }
    return newPayment;
  } catch (error) {
    logger.error("Error creating payment record: ", error);
    return null;
  }
}

export const completePayment = async (paymentId: string, updateData: Partial<IPayment>): Promise<IPayment | null> => {
  try {
    const updatedPayment = await Payment.findOneAndUpdate({ pi_payment_id: paymentId }, updateData, { new: true }).exec();
    if (!updatedPayment) {
      logger.error("unable to update payment record");
      return null;
    }
    return updatedPayment || null;
  } catch (error:any) {
    logger.error('error occured while updating payment: ', error.message);
    return null;
  }
  
}