import Payment from "../../src/models/Payment";
import PaymentCrossReference from "../../src/models/PaymentCrossReference";
import { PaymentType } from "../../src/models/enums/paymentType";
import { U2UPaymentStatus } from "../../src/models/enums/u2uPaymentStatus";
import { NewPayment, U2URefDataType } from "../../src/types";
import { 
  createPayment,
  completePayment,
  createOrUpdatePaymentCrossReference
} from '../../src/services/payment.service';

jest.mock('../../src/models/Payment');
jest.mock('../../src/models/PaymentCrossReference');

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

    await expect(completePayment(piPaymentId, txid)).rejects.toThrow('Mock database error');
  });
});

describe('createOrUpdatePaymentCrossReference function', () => {
  const mockOrderId = 'order1_TEST';
  const mockRefData: U2URefDataType = {
    u2aPaymentId: 'u2aPaymentId1_TEST',
    a2uPaymentId: 'a2uPaymentId1_TEST',
    u2uStatus: U2UPaymentStatus.Completed
  };

  it('should update an existing cross-reference and return the updated document', async () => {
    const mockExistingRef = { order_id: mockOrderId };

    const mockUpdatedRef = {
      order_id: mockOrderId,
      a2u_payment_id: mockRefData.a2uPaymentId,
      u2u_status: mockRefData.u2uStatus,
      a2u_completed_at: expect.any(Date),
    };

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRef),
    });

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedRef),
    });

    const result = await createOrUpdatePaymentCrossReference(mockOrderId, mockRefData);

    expect(PaymentCrossReference.findOne).toHaveBeenCalledWith({ order_id: mockOrderId });
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalledWith(
      { order_id: mockOrderId },
      {
        a2u_payment_id: mockRefData.a2uPaymentId,
        a2u_completed_at: expect.any(Date),
        u2u_status: mockRefData.u2uStatus,
      },
      { new: true }
    );
    expect(result).toEqual(mockUpdatedRef);
  });

  it('should create a new cross-reference if one does not exist', async () => {
    const mockNewRef = {
      order_id: mockOrderId,
      u2a_payment_id: mockRefData.u2aPaymentId,
      u2a_completed_at: expect.any(Date),
      a2u_payment_id: null,
    };

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock PaymentCrossReference.save
    const mockSave = jest.fn().mockResolvedValue(mockNewRef);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));

    const result = await createOrUpdatePaymentCrossReference(mockOrderId, mockRefData);

    expect(PaymentCrossReference.findOne).toHaveBeenCalledWith({ order_id: mockOrderId });
    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual(mockNewRef);
  });

  it('should throw an error if update returns null', async () => {
    const mockExistingRef = { order_id: mockOrderId };

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRef),
    });

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(createOrUpdatePaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'Failed to update Payment xRef'
    );
  });

  it('should throw an error if creating/ updating payment cross reference fails', async () => {
    const error = new Error('Mock database error');

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(error),
    });

    await expect(createOrUpdatePaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'Mock database error'
    );
  });
});

// describe('createA2UPayment', () => {
//   const mockA2UData: A2UPaymentDataType = {
//     orderId: 'order1_TEST',
//     sellerId: 'seller1_TEST',
//     buyerId: 'buyer1_TEST',
//     amount: '1.00',
//     paymentType: PaymentType.BuyerCheckout
//   };

//   const mockSeller = { seller_id: 'seller1_TEST' };
//   const mockPaymentId = 'payment1_TEST';
//   const mockTxid = 'txid1_TEST';
//   const mockCreatedPayment = { _id: 'payment1_TEST', piPaymentId: mockPaymentId };
//   const mockUpdatedPayment = { _id: 'payment1_TEST', status: U2UPaymentStatus.Completed };
//   const mockXref = { order_id: 'order1_TEST', a2u_payment_id: 'payment1_TEST' };
//   const mockCompletedPiPayment = { completed: true };

//   beforeEach(() => {
//     (Seller.findById as jest.Mock).mockReturnValue({
//       select: jest.fn().mockReturnValue({
//         exec: jest.fn().mockResolvedValue(mockSeller),
//       }),
//     });
    
//     (pi.createPayment as jest.Mock).mockResolvedValue(mockPaymentId);
//     (createPayment as jest.Mock).mockResolvedValue(mockCreatedPayment);
//     (pi.submitPayment as jest.Mock).mockResolvedValue(mockTxid);
//     (completePayment as jest.Mock).mockResolvedValue(mockUpdatedPayment);
//     (createOrUpdatePaymentCrossReference as jest.Mock).mockResolvedValue(mockXref);
//     (pi.completePayment as jest.Mock).mockResolvedValue(mockCompletedPiPayment);
//   });

//   it('should successfully process and return completed A2U payment', async () => {
//     const result = await createA2UPayment(mockA2UData);

//     expect(Seller.findById).toHaveBeenCalledWith(mockA2UData.sellerId);
//     expect(pi.createPayment).toHaveBeenCalledWith({
//       amount: 0.99,
//       memo: 'A2U payment',
//       metadata: { direction: 'A2U' },
//       uid: mockSeller.seller_id,
//     });
//     expect(createPayment).toHaveBeenCalled();
//     expect(pi.submitPayment).toHaveBeenCalledWith(mockPaymentId);
//     expect(completePayment).toHaveBeenCalledWith(mockPaymentId, mockTxid);
//     expect(createOrUpdatePaymentCrossReference).toHaveBeenCalledWith(mockA2UData.orderId, {
//       u2uStatus: U2UPaymentStatus.A2UCompleted,
//       a2uPaymentId: mockUpdatedPayment._id,
//     });
//     expect(pi.completePayment).toHaveBeenCalledWith(mockPaymentId, mockTxid);
//     expect(result).toEqual(mockUpdatedPayment);
//   });
// });