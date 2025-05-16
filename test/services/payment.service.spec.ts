import Payment from "../../src/models/Payment";
import { PaymentType } from "../../src/models/enums/paymentType";
import { NewPayment } from "../../src/types";
import { 
  createPayment,
  completePayment
} from '../../src/services/payment.service';

jest.mock('../../src/models/Payment');

describe('createPayment function', () => {
  const mockPaymentData: NewPayment = {
    piPaymentId: 'test_pi_payment_123',
    userId: 'test_user_456',
    memo: 'Test payment memo',
    amount: '100',
    paymentType: PaymentType.BuyerCheckout,
  };

  it('should create and save a payment successfully', async () => {
    const mockSavedPayment = {
      _id: 'mock_payment_id',
      ...mockPaymentData,
      paid: false,
      cancelled: false,
    };

    // Mock Payment.save()
    const mockSave = jest.fn().mockResolvedValue(mockSavedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));

    const result = await createPayment(mockPaymentData);

    expect(Payment).toHaveBeenCalledWith({
      pi_payment_id: mockPaymentData.piPaymentId,
      user_id: mockPaymentData.userId,
      amount: mockPaymentData.amount,
      paid: false,
      memo: mockPaymentData.memo,
      payment_type: mockPaymentData.paymentType,
      cancelled: false,
    });
    expect(result).toEqual(mockSavedPayment);
  });

  it('should throw an error if creating payment fails', async () => {
    const error = new Error('Mock database error');

    (Payment as any).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(error),
    }));

    await expect(createPayment(mockPaymentData)).rejects.toThrow('Mock database error');
  });
});

describe('completePayment function', () => {
  const piPaymentId = 'piPaymentId1_TEST';
  const txid = 'txid1_TEST';

  it('should update the payment as paid and return the updated payment', async () => {
    const mockUpdatedPayment = {
      _id: 'paymentId1_TEST',
      pi_payment_id: piPaymentId,
      txid,
      paid: true,
      user_id: 'userId1_TEST',
      amount: '100',
      memo: 'Test Memo',
      payment_type: PaymentType.BuyerCheckout,
      cancelled: false,
    };

    // Mock Payment.findOneAndUpdate
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    const result = await completePayment(piPaymentId, txid);

    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_payment_id: piPaymentId },
      { $set: { txid, paid: true } },
      { new: true }
    );
    expect(result).toEqual(mockUpdatedPayment);
  });

  it('should throw an error if no payment is found to update', async () => {
    // Mock Payment.findOneAndUpdate
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    await expect(completePayment(piPaymentId, txid)).rejects.toThrow('Failed to update payment');
  });

  it('should throw an error if completing payment fails', async () => {
    const error = new Error('Mock database error');

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(error)
    });

    await expect(completePayment(piPaymentId, txid))
      .rejects.toThrow('Mock database error');
  });
});