import pi from "../../src/config/platformAPIclient";
import Payment from "../../src/models/Payment";
import PaymentCrossReference from "../../src/models/PaymentCrossReference";
import Seller from "../../src/models/Seller";
import User from "../../src/models/User";
import { PaymentType } from "../../src/models/enums/paymentType";
import { U2UPaymentStatus } from "../../src/models/enums/u2uPaymentStatus";
import { 
  createPayment,
  completePayment,
  createPaymentCrossReference,
  updatePaymentCrossReference,
  createA2UPayment,
  getPayment,
  cancelPayment
} from '../../src/services/payment.service';
import { 
  A2UPaymentDataType, 
  NewPayment, 
  U2URefDataType 
} from "../../src/types";

jest.mock('../../src/config/platformAPIclient', () => ({
  __esModule: true,
  default: {
    createPayment: jest.fn(),
    submitPayment: jest.fn(),
    completePayment: jest.fn(),
    getIncompleteServerPayments: jest.fn()
  },
}));

jest.mock('../../src/models/Payment');
jest.mock('../../src/models/PaymentCrossReference');
jest.mock('../../src/models/Seller');
jest.mock('../../src/models/User');

describe('createPayment function', () => {
  const mockUser = { _id: 'mock_user_id' };

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

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    // Mock Payment.save()
    const mockSave = jest.fn().mockResolvedValue(mockSavedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));

    const result = await createPayment(mockPaymentData);

    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockPaymentData.userId });
    expect(Payment).toHaveBeenCalledWith({
      pi_payment_id: mockPaymentData.piPaymentId,
      user_id: mockUser._id,
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

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

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

describe('createPaymentCrossReference function', () => {
  const mockOrderId = 'order1_TEST';
  const mockRefData: U2URefDataType = {
    u2aPaymentId: 'u2aPaymentId1_TEST',
    a2uPaymentId: 'a2uPaymentId1_TEST',
    u2uStatus: U2UPaymentStatus.Completed
  };

  it('should create a new payment xref successfully', async () => {
    const mockNewRef = {
      order_id: mockOrderId,
      u2a_payment_id: mockRefData.u2aPaymentId,
      u2a_completed_at: expect.any(Date),
      a2u_payment_id: null,
    };

    // Mock PaymentCrossReference.save
    const mockSave = jest.fn().mockResolvedValue(mockNewRef);
    (PaymentCrossReference as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));

    const result = await createPaymentCrossReference(mockOrderId, mockRefData);

    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual(mockNewRef);
  });

  it('should throw an error if creating payment xref fails', async () => {
    const mockError = new Error('Mock database error');

    jest.spyOn(PaymentCrossReference.prototype, 'save').mockRejectedValueOnce(mockError);

    await expect(createPaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'Mock database error'
    );
  });
});

describe('updatePaymentCrossReference function', () => {
  const mockOrderId = 'order1_TEST';
  const mockRefData: U2URefDataType = {
    u2aPaymentId: 'u2aPaymentId1_TEST',
    a2uPaymentId: 'a2uPaymentId1_TEST',
    u2uStatus: U2UPaymentStatus.Completed
  };

  it('should update an existing payment xref and return the updated document', async () => {
    const mockUpdatedRef = {
      order_id: mockOrderId,
      a2u_payment_id: mockRefData.a2uPaymentId,
      u2u_status: mockRefData.u2uStatus,
      a2u_completed_at: expect.any(Date),
    };

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValueOnce({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(mockUpdatedRef)
      })),
    });

    const result = await updatePaymentCrossReference(mockOrderId, mockRefData);

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

  it('should throw an error if no document was found to update', async () => {
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(null)
      })),
    });

    await expect(updatePaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'No Payment xRef found to update');
  });

  it('should throw an error if updating payment xref fails', async () => {
    const mockError = new Error('Mock database error');

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockRejectedValue(mockError),
      })),
    });

    await expect(updatePaymentCrossReference(mockOrderId, mockRefData)).rejects.toThrow(
      'Mock database error'
    );
  });
});

describe('createA2UPayment function', () => {
  const mockUser = { _id: 'mock_user_id' };
  const mockSeller = { seller_id: 'seller1_TEST' };
  const mockOrderId = 'order1_TEST';
  const mockPiPaymentId = 'piPaymentId1_TEST';
  const mockTxid = 'txid1_TEST';
  const mockCompletedPiPayment = { completed: true };

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

  const mockServerPayments = [
    {
      identifier: mockPiPaymentId,
      user_uid: mockUpdatedPayment.user_id,
      amount: mockUpdatedPayment.amount,
      memo: mockUpdatedPayment.memo,
    }
  ];
  
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
    memo: 'A2U payment',
    paymentType: PaymentType.BuyerCheckout
  };

  beforeEach(() => {
    // Mock Pi SDK
    (pi.createPayment as jest.Mock).mockResolvedValue(mockPiPaymentId);
    (pi.submitPayment as jest.Mock).mockResolvedValue(mockTxid);
    (pi.completePayment as jest.Mock).mockResolvedValue(mockCompletedPiPayment);
    (pi.getIncompleteServerPayments as jest.Mock).mockResolvedValue(mockServerPayments);
  });

  it('should successfully process and return completed A2U payment', async () => {    
    // Mock Seller.findById()
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller)
      }),
    });

    // Mock User.findOne()
    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    // Mock Payment.save()
    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    // Mock Payment.findOneAndUpdate
    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    // Mock PaymentCrossReference.findOneAndUpdate
    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(mockUpdatedRef)
      }))
    });

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(pi.completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
    expect(pi.getIncompleteServerPayments).not.toHaveBeenCalled();
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

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }))
    });

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(mockPaymentSave).not.toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
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

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(mockPaymentSave).not.toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if creating payment internally fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(null);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).not.toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if Pi SDK submitPayment fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (pi.submitPayment as jest.Mock).mockRejectedValue(new Error('Mock Pi SDK error'));

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });
    
    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if completing payment internally fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).not.toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if updating payment cross reference fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(null)
      }))
    });

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(pi.completePayment).not.toHaveBeenCalled();
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should fail gracefully and return null if Pi SDK completePayment fails', async () => {
    (Seller.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSeller),
      }),
    });

    (User.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser)
    });

    (pi.completePayment as jest.Mock).mockRejectedValue(new Error('Mock Pi SDK error'));

    const mockPaymentSave = jest.fn().mockResolvedValue(mockUpdatedPayment);
    (Payment as unknown as jest.Mock).mockImplementation(() => ({ save: mockPaymentSave }));

    (Payment.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUpdatedPayment),
    } as any);

    (PaymentCrossReference.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn(() => ({
        exec: jest.fn().mockResolvedValue(mockUpdatedRef)
      }))
    });

    const result = await createA2UPayment(mockA2UPaymentData);

    expect(Seller.findById).toHaveBeenCalledWith(mockA2UPaymentData.sellerId);
    expect(pi.createPayment).toHaveBeenCalledWith({
      amount: 0.99,
      memo: 'A2U payment',
      metadata: { 
        direction: 'A2U',
        orderId: mockA2UPaymentData.orderId,
        sellerId: mockA2UPaymentData.sellerId,
        buyerId: mockA2UPaymentData.buyerId   
      },
      uid: mockSeller.seller_id,
    });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockA2UPaymentData.buyerId });
    expect(mockPaymentSave).toHaveBeenCalled();
    expect(pi.submitPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
    expect(PaymentCrossReference.findOneAndUpdate).toHaveBeenCalled();
    expect(pi.completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
    expect(pi.getIncompleteServerPayments).toHaveBeenCalled();
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