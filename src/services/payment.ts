import PiNetwork from 'pi-backend';
import { env } from '../utils/env';
import { Request, Response } from "express";

const apiKey = env.PI_API_KEY
const walletPrivateSeed = env.WALLET_PRIVATE_SEED // starts with S
const pi = new PiNetwork(apiKey, walletPrivateSeed);


export const makePayment = async (req: Request, res: Response) => {
  const currentUser = req.currentUser;
  console.log('user id: ', currentUser?.pi_uid)
  const paymentCallbacks = {
    onReadyForServerApproval: function(paymentId:string) { 
      console.log("payment id: ", paymentId)
     },
    onReadyForServerCompletion: function(paymentId:string, txid:string) { 
      console.log("transaction id: ", txid)
     },
    onCancel: function(paymentId:string) { 
      console.log("payment cancelled: ", paymentId)
     },
    onError: function(error:any, payment:any) { 
      console.log("payment error: ", error)
     }
  };
  const paymentData = {
    amount: 1,
    memo: 'This is a Test Payment',
    metadata: { order_id: 1234 },
    uid: currentUser?.pi_uid as string,

  };
  const scope = [
    'username', 'payments'
  ]
  const paymentId = await pi.createPayment(paymentData);
  console.log("returned payment: ", paymentId)
}