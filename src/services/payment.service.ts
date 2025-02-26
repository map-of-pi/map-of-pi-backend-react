import { env } from "../utils/env";
import PiNetwork from 'pi-backend';

const apiKey = env.PI_API_KEY
const walletPrivateSeed = env.WALLET_PRIVATE_SEED // starts with S
const pi = new PiNetwork(apiKey, walletPrivateSeed);

export type PaymentDataType = {
  amount: number;
  memo: string;
  metadata: any;
  uid: string
}

export const makePayment = async (paymentId: string) => {
  try {
  const txid = await pi.submitPayment(paymentId);
  const completedPayment = await pi.completePayment(paymentId, txid);
  console.log('payment Data: ', completedPayment)
  } catch(error: any){
    console.log('error dueing payment, ', error)
  }
  // const paymentId = await pi.createPayment(paymentData);
  

  
}