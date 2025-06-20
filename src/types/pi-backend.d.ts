declare module 'pi-backend' {
    import { AxiosClientOptions, PaymentArgs, PaymentDTO } from './types';
  
    export default class PiNetwork {
      constructor(apiKey: string, walletPrivateSeed: string, options?: AxiosClientOptions | null);
  
      createPayment(paymentData: PaymentArgs): Promise<string>;
      submitPayment(paymentId: string): Promise<string>;
      completePayment(paymentId: string, txid: string): Promise<PaymentDTO>;
      getPayment(paymentId: string): Promise<PaymentDTO>;
      cancelPayment(paymentId: string): Promise<PaymentDTO>;
      getIncompleteServerPayments(): Promise<Array<PaymentDTO>>;
    }
  }  