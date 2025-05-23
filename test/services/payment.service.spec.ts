import pi from "../../src/config/platformAPIclient";
import Payment from "../../src/models/Payment";
import PaymentCrossReference from "../../src/models/PaymentCrossReference";
import Seller from "../../src/models/Seller";
import { PaymentType } from "../../src/models/enums/paymentType";
import { U2UPaymentStatus } from "../../src/models/enums/u2uPaymentStatus";
import { 
  A2UPaymentDataType, 
  NewPayment, 
  U2URefDataType 
} from "../../src/types";
import { 
  createPayment,
  completePayment,
  createOrUpdatePaymentCrossReference,
  createA2UPayment,
  getPayment,
  cancelPayment
} from '../../src/services/payment.service';

jest.mock('../../src/config/platformAPIclient', () => ({
  __esModule: true,
  default: {
    createPayment: jest.fn(),
    submitPayment: jest.fn(),
    completePayment: jest.fn(),
  },
}));

jest.mock('../../src/models/Payment');
jest.mock('../../src/models/PaymentCrossReference');
jest.mock('../../src/models/Seller');

describe('createPayment function', () => {
  const mockPaymentData: NewPayment = {
    piPaymentId: 'payment1_TEST',
    userId: 'userId1_TEST',
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
    const mockError = new Error('Mock database error');

    (Payment as any).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(mockError),
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
    const mockError = new Error('Mock database error');

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(mockError)
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
    const mockError = new Error('Mock database error');

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(mockError),
    });

    await expect(createOrUpdatePaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'Mock database error'
    );
  });
});

describe('createA2UPayment function', () => {
  const mockSeller = { seller_id: 'seller1_TEST' };
  const mockOrderId = 'order1_TEST';
  const mockPiPaymentId = 'piPaymentId1_TEST';
  const mockTxid = 'txid1_TEST';
  const mockCompletedPiPayment = { completed: true };
  const mockExistingRef = { order_id: 'order1_TEST' };

  const mockUpdatedPayment = {
    pi_payment_id: mockPiPaymentId,
    txid: mockTxid,
    paid: true,
    user_id: 'userId1_TEST',
    amount: '100',
    memo: 'Test Memo',
    payment_type: PaymentType.BuyerCheckout,
    cancelled: false,
    createdAt: expect.any(Date)
  };
  
  const mockRefData: U2URefDataType = {
    u2aPaymentId: 'u2aPaymentId1_TEST',
    a2uPaymentId: 'a2uPaymentId1_TEST',
    u2uStatus: U2UPaymentStatus.Completed
  };

  const mockUpdatedRef = {
    order_id: mockOrderId,
    a2u_payment_id: mockRefData.a2uPaymentId,
    u2u_status: mockRefData.u2uStatus,
    a2u_completed_at: expect.any(Date),
  };

  const mockA2UPaymentData: A2UPaymentDataType = {
    orderId: 'order1_TEST',
    sellerId: 'seller1_TEST',
    buyerId: 'buyer1_TEST',
    amount: '1.00',
    paymentType: PaymentType.BuyerCheckout
  };

  beforeEach(() => {
    // Mock Pi SDK
    (pi.createPayment as jest.Mock).mockResolvedValue(mockPiPaymentId);
    (pi.submitPayment as jest.Mock).mockResolvedValue(mockTxid);
    (pi.completePayment as jest.Mock).mockResolvedValue(mockCompletedPiPayment);
  });

  it('should successfully process and return completed A2U payment with existing payment cross reference', async () => {    
    // Mock Seller.findById()
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    // Mock Payment.save()
    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    // Mock Payment.findOneAndUpdate
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRef),
    });

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedRef),
    });

    // Mock PaymentCrossReference.save
    const mockPaymentXRefSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
    expect(result).toEqual(mockUpdatedPayment);
  });

  it('should successfully process and return completed A2U payment with new payment cross reference', async () => {
    const mockNewRef = {
      order_id: mockOrderId,
      u2a_payment_id: mockRefData.u2aPaymentId
    };
    
    // Mock Seller.findById()
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    // Mock Payment.save()
    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    // Mock Payment.findOneAndUpdate
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock PaymentCrossReference.save
    const mockPaymentXRefSave = jest.fn().mockResolvedValue(mockNewRef);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).toHaveBeenCalled();
    expect(pi.completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
    expect(result).toEqual(mockUpdatedPayment);
  });

  it('should fail gracefully and return null if seller is not found', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    })

    const mockPaymentSave = jest.fn().mockResolvedValue(null);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    // Mock PaymentCrossReference.findOne
    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock PaymentCrossReference.save
    const mockPaymentXRefSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).not.toHaveBeenCalled();
    expect(mockPaymentSave).not.toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if Pi SDK createPayment fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (pi.createPayment as jest.Mock).mockRejectedValue(new Error('Mock Pi SDK error'));

    const mockPaymentSave = jest.fn().mockResolvedValue(null);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(null);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).not.toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if creating payment internally fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(null);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(null);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if Pi SDK submitPayment fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (pi.submitPayment as jest.Mock).mockRejectedValue(new Error('Mock Pi SDK error'));

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(null);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if completing payment internally fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(null);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if creating/ updating payment cross reference fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRef),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(null);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if Pi SDK completePayment fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (pi.completePayment as jest.Mock).mockRejectedValue(new Error('Mock Pi SDK error'));

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    (PaymentCrossReference.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingRef),
    });

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUpdatedRef),
    });

    const mockPaymentXRefSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentXRefSave }));
    
    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { direction: 'A2U' },
      uid: mockSeller.seller_id,
    });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOne).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(mockPaymentXRefSave).not.toHaveBeenCalled();
    expect(pi.completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
    expect(result).toBeNull();
  });
});

describe('getPayment function', () => {
  const mockPiPaymentId = 'piPaymentId1_TEST';

  it('should return the payment if found', async () => {
    const mockExistingPayment = { pi_payment_id: mockPiPaymentId, amount: 100 };
    
    (Payment.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockExistingPayment)
    });

    const result = await getPayment(mockPiPaymentId);

    expect(Payment.findOne).toHaveBeenCalledWith({ pi_payment_id: mockPiPaymentId });
    expect(result).toEqual(mockExistingPayment);
  });

  it('should return null if no payment is found', async () => {
    (Payment.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await getPayment(mockPiPaymentId);

    expect(Payment.findOne).toHaveBeenCalledWith({ pi_payment_id: mockPiPaymentId });
    expect(result).toBeNull();
  });

  it('should throw an error if getting payment fails', async () => {
    const mockError = new Error('Mock database error');

    (Payment.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(mockError)
    });

    await expect(getPayment(mockPiPaymentId)).rejects.toThrow('Mock database error');
  });
});

describe('cancelPayment function', () => {
  const mockPiPaymentId = 'piPaymentId1_TEST';

  it('should return the cancelled payment if successful', async () => {
    const mockCancelledPayment = {
      pi_payment_id: mockPiPaymentId,
      cancelled: true,
      paid: false,
    };

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({ 
      exec: jest.fn().mockResolvedValueOnce(mockCancelledPayment),
    } as any);

    const result = await cancelPayment(mockPiPaymentId);

    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_payment_id: mockPiPaymentId },
      { $set: { cancelled: true, paid: false } },
      { new: true }
    );
    expect(result).toEqual(mockCancelledPayment);
  });

  it('should return null if no payment is found', async () => {
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({ 
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    await expect(cancelPayment(mockPiPaymentId)).rejects.toThrow('Failed to cancel payment');

    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { pi_payment_id: mockPiPaymentId },
      { $set: { cancelled: true, paid: false } },
      { new: true }
    );
  });

  it('should throw and log an error if query fails', async () => {
    const mockError = new Error('Mock database error');

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(mockError)
    });

    await expect(cancelPayment(mockPiPaymentId)).rejects.toThrow('Mock database error');
  });
});