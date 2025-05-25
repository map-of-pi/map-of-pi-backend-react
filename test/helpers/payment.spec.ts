import axios from "axios";
import { platformAPIClient } from "../../src/config/platformAPIclient";
import {
  processIncompletePayment,
  processPaymentApproval,
  processPaymentCancellation,
  processPaymentCompletion
} from "../../src/helpers/payment";
import Seller from "../../src/models/Seller";
import User from "../../src/models/User";
import { FulfillmentType } from "../../src/models/enums/fulfillmentType";
import { OrderStatusType } from "../../src/models/enums/orderStatusType";
import { PaymentType } from "../../src/models/enums/paymentType";
import { U2UPaymentStatus } from "../../src/models/enums/u2uPaymentStatus";
import { 
  cancelOrder,
  createOrder, 
  updatePaidOrder 
} from "../../src/services/order.service";
import { 
  cancelPayment,
  completePayment, 
  createA2UPayment, 
  createOrUpdatePaymentCrossReference, 
  createPayment, 
  getPayment 
} from "../../src/services/payment.service";
import { IUser, PaymentDataType } from "../../src/types";

jest.mock('axios');
jest.mock('../../src/config/platformAPIclient', () => ({
  platformAPIClient: {
    get: jest.fn(),
    post: jest.fn()
  },
}));
jest.mock('../../src/models/Seller');
jest.mock('../../src/models/User');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/services/order.service');

describe('processIncompletePayment function', () => {
  const mockBuyerId = 'buyer1_idTEST';
  const mockSellerId = 'seller1_idTEST';

  const mockPaymentInfo = {
    identifier: 'paymentInfo1_TEST',
    transaction: {
      txid: 'txid1_TEST',
      _link: 'https://api.blockchain.pi/payment_TEST/',
    },
  };

  const mockIncompletePayment = {
    pi_payment_id: mockPaymentInfo.identifier,
    user_id: mockBuyerId,
    amount: '10',
    paid: false,
    memo: 'Test payment memo',
    payment_type: PaymentType.BuyerCheckout,
    cancelled: false
  };

  it('should process incomplete payment successfully', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockIncompletePayment);

    // Mock Horizon API memo match
    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: mockPaymentInfo.identifier } }),
    });

    (completePayment as jest.Mock).mockResolvedValue({
      _id: 'payment_idTEST',
      pi_payment_id: mockPaymentInfo.identifier,
      user_id: mockBuyerId,
      amount: '10',
      paid: true,
      memo: 'Test payment memo',
      payment_type: PaymentType.BuyerCheckout,
      cancelled: false
    });

    (updatePaidOrder as jest.Mock).mockResolvedValue({
      buyer_id: mockBuyerId,
      seller_id: mockSellerId,
      payment_id: mockPaymentInfo.identifier,
      total_amount: '10',
      status: OrderStatusType.Pending,
      is_paid: true,
      is_fulfilled: false,
      fulfillment_method: FulfillmentType.CollectionByBuyer,
      seller_fulfillment_description: 'Pickup from store',
      buyer_fulfillment_description: 'Will pickup tomorrow'
    });

    // Mock platformAPIClient.post
    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processIncompletePayment(mockPaymentInfo);

    expect(result).toEqual({
      success: true,
      message: `Payment completed from incomplete payment with id ${ mockPaymentInfo.identifier }`
    });

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction.txid);
    expect(updatePaidOrder).toHaveBeenCalledWith('payment_idTEST');
    expect(platformAPIClient.post).toHaveBeenCalledWith(
      `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
      { txid: 'txid1_TEST' }
    );
  });

  it('should throw an error if Horizon API request fails', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockIncompletePayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('Horizon API timeout')),
    });

    await expect(processIncompletePayment(mockPaymentInfo))
    .rejects
    .toThrow('Horizon API timeout');

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(completePayment).not.toHaveBeenCalled();
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();
  });

  it('should throw error if no corresponding incomplete payment is found', async () => {
    (getPayment as jest.Mock).mockResolvedValue(null);

    await expect(processIncompletePayment(mockPaymentInfo))
    .rejects
    .toThrow("Finding incomplete payment failed");

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).not.toHaveBeenCalled();
    expect(completePayment).not.toHaveBeenCalled();
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();
  });

  it('should throw error if blockchain memo does not match the internal paymentID', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockIncompletePayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: 'unmatched memo' } }),
    });

    await expect(processIncompletePayment(mockPaymentInfo))
    .rejects
    .toThrow("Unable to find payment on the Pi Blockchain");

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(completePayment).not.toHaveBeenCalled();
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();
  });

  it('should not update paid order if the payment type is not BuyerCheckout', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockIncompletePayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: mockPaymentInfo.identifier } }),
    });

    (completePayment as jest.Mock).mockResolvedValue({
      pi_payment_id: mockPaymentInfo.identifier,
      user_id: mockBuyerId,
      amount: '10',
      paid: true,
      memo: 'Test payment memo',
      payment_type: PaymentType.Membership,
      cancelled: false
    });

    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processIncompletePayment(mockPaymentInfo);

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction.txid);
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).toHaveBeenCalledWith(
      `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
      { txid: 'txid1_TEST' }
    );

    expect(result).toEqual({
      success: true,
      message: `Payment completed from incomplete payment with id ${ mockPaymentInfo.identifier }`
    });
  });

  it('should throw error if notifying Pi Platform of payment completion fails', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockIncompletePayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: mockPaymentInfo.identifier } }),
    });

    (completePayment as jest.Mock).mockResolvedValue({
      _id: 'payment_idTEST',
      pi_payment_id: mockPaymentInfo.identifier,
      user_id: mockBuyerId,
      amount: '10',
      paid: true,
      memo: 'Test payment memo',
      payment_type: PaymentType.BuyerCheckout,
      cancelled: false
    });

    (updatePaidOrder as jest.Mock).mockResolvedValue({
      buyer_id: mockBuyerId,
      seller_id: mockSellerId,
      payment_id: mockPaymentInfo.identifier,
      total_amount: '10',
      status: OrderStatusType.Pending,
      is_paid: true,
      is_fulfilled: false,
      fulfillment_method: FulfillmentType.CollectionByBuyer,
      seller_fulfillment_description: 'Pickup from store',
      buyer_fulfillment_description: 'Will pickup tomorrow'
    });

    (platformAPIClient.post as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

    await expect(processIncompletePayment(mockPaymentInfo))
    .rejects
    .toThrow('Pi Platform API timeout');

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction.txid);
    expect(updatePaidOrder).toHaveBeenCalledWith('payment_idTEST');
    expect(platformAPIClient.post).toHaveBeenCalledWith(
      `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
      { txid: 'txid1_TEST' }
    );
  });
});

describe('processPaymentApproval function', () => {
  const mockPiPaymentId = 'payment1_TEST';
  const mockOrder = { _id: 'order1_idTEST', status: OrderStatusType.Initialized };
  const mockTxid = 'txid1_TEST';
  const mockBuyer = { _id: 'buyer1_idTEST', pi_uid: 'buyer1_TEST' };
  const mockSeller = { _id: 'seller1_idTEST', seller_id: 'seller1_TEST' };

  const mockUser: IUser = {
    pi_uid: 'pi_uidTEST',
    pi_username: 'pi_usernameTEST',
    user_name: 'pi_userTEST'
  } as IUser;

  const mockPayment = {
    pi_payment_id: mockPiPaymentId,
    txid: mockTxid,
    paid: false,
    user_id: 'userId1_TEST',
    amount: '100',
    memo: 'Test Memo',
    payment_type: PaymentType.BuyerCheckout,
    cancelled: false,
    createdAt: expect.any(Date)
  };

  const currentPayment: PaymentDataType = {
    amount: mockPayment.amount,
    memo: mockPayment.memo,
    metadata: {
      payment_type: PaymentType.BuyerCheckout,
      OrderPayment: {
        seller: mockSeller._id,
        buyer: mockBuyer._id,
        fulfillment_method: FulfillmentType.CollectionByBuyer,
        seller_fulfillment_description: 'Pickup from store',
        buyer_fulfillment_description: 'Will pickup tomorrow',
        items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
      },
    },
  };

  it('should process and approve a new BuyerCheckout payment successfully', async () => {
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: currentPayment });
    // Mock no existing payment
    (getPayment as jest.Mock).mockResolvedValue(null);

    // Mock functions in checkoutProcess
    (Seller.findOne as jest.Mock).mockResolvedValue(mockSeller);
    (User.findOne as jest.Mock).mockResolvedValue(mockBuyer);
    (createPayment as jest.Mock).mockResolvedValue(mockPayment);
    (createOrder as jest.Mock).mockResolvedValue(mockOrder);

    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processPaymentApproval(mockPiPaymentId, mockUser);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(getPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Seller.findOne).toHaveBeenCalledWith({ seller_id: currentPayment.metadata.OrderPayment?.seller });
    expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockUser.pi_uid });
    expect(createPayment).toHaveBeenCalledWith({
      piPaymentId: mockPiPaymentId,
      userId: mockBuyer._id,
      memo: mockPayment.memo,
      amount: mockPayment.amount,
      paymentType: PaymentType.BuyerCheckout
    });
    expect(createOrder).toHaveBeenCalledWith({
      buyerId: mockBuyer._id,
      sellerId: mockSeller._id,
      paymentId: mockPiPaymentId,
      totalAmount: mockPayment.amount,
      status: OrderStatusType.Initialized,
      fulfillmentMethod: currentPayment.metadata.OrderPayment?.fulfillment_method,
      sellerFulfillmentDescription: currentPayment.metadata.OrderPayment?.seller_fulfillment_description,
      buyerFulfillmentDescription: currentPayment.metadata.OrderPayment?.buyer_fulfillment_description,
    },
      currentPayment.metadata.OrderPayment?.items
    );
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/approve`);
    expect(result).toEqual({
      success: true,
      message: `Payment approved with id ${ mockPiPaymentId }`,
    });
  });

  it('should return failure if payment already exists', async () => {
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: currentPayment });
    // Mock existing payment
    (getPayment as jest.Mock).mockResolvedValue(mockPayment);

    const result = await processPaymentApproval(mockPiPaymentId, mockUser);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(getPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Seller.findOne).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(createPayment).not.toHaveBeenCalled();
    expect(createOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      message: `Payment with ID ${ mockPiPaymentId } already exists`,
    });
  });

  it('should skip checkout process if payment type is Membership', async () => {
    const currentPayment_Membership: PaymentDataType = {
      ...currentPayment,
      metadata: {
        payment_type: PaymentType.Membership
      }
    };

    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: currentPayment_Membership });
    (getPayment as jest.Mock).mockResolvedValue(null);
    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processPaymentApproval(mockPiPaymentId, mockUser);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(getPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(Seller.findOne).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(createPayment).not.toHaveBeenCalled();
    expect(createOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/approve`);

    expect(result).toEqual({
      success: true,
      message: `Payment approved with id ${ mockPiPaymentId }`,
    });
  });
});

describe('processPaymentCompletion function', () => {
  const mockBuyerId = 'buyer1_idTEST';
  const mockSellerId = 'seller1_idTEST';
  const mockPiPaymentId = 'payment1_TEST';
  const mockTxId = 'txid1_TEST';

  const mockCompletedPayment = {
    _id: 'payment_idTEST',
    pi_payment_id: mockPiPaymentId,
    user_id: mockBuyerId,
    txid: mockTxId,
    amount: '10',
    paid: true,
    memo: 'Test payment memo',
    payment_type: PaymentType.BuyerCheckout,
    cancelled: false
  };

  const mockOrder = {
    _id: 'order_idTEST',
    buyer_id: mockBuyerId,
    seller_id: mockSellerId,
    total_amount: '20',
    status: OrderStatusType.Pending
  };

  it('should process BuyerCheckout payment and create A2U payment successfully', async () => {
    // Mock platformAPIClient.get
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
    (completePayment as jest.Mock).mockResolvedValue(mockCompletedPayment);
    (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);
    (createOrUpdatePaymentCrossReference as jest.Mock).mockResolvedValue({});
    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });
    (createA2UPayment as jest.Mock).mockResolvedValue({});

    const result = await processPaymentCompletion(mockPiPaymentId, mockTxId);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxId);
    expect(updatePaidOrder).toHaveBeenCalledWith(mockCompletedPayment._id);
    expect(createOrUpdatePaymentCrossReference).toHaveBeenCalledWith(
      mockOrder._id, 
      {
        u2aPaymentId: mockCompletedPayment._id,
        u2uStatus: U2UPaymentStatus.U2ACompleted,
        a2uPaymentId: null
      }
    );
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxId });
    expect(createA2UPayment).toHaveBeenCalledWith({
      sellerId: mockOrder.seller_id,
      amount: mockOrder.total_amount,
      buyerId: mockOrder.buyer_id,
      paymentType: PaymentType.BuyerCheckout,
      orderId: mockOrder._id
    });
    expect(result).toEqual({
      success: true,
      message: `Payment completed with id ${ mockPiPaymentId }`
    });
  });

  it('should throw error if confirming payment via Pi Platform fails', async () => {
    (platformAPIClient.get as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

    await expect(processPaymentCompletion(mockPiPaymentId, mockTxId))
    .rejects
    .toThrow('Pi Platform API timeout');

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).not.toHaveBeenCalled();
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(createOrUpdatePaymentCrossReference).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();
    expect(createA2UPayment).not.toHaveBeenCalled();
  });

  it('should throw error if notifying Pi Platform of payment completion for BuyerCheckout fails', async () => {
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
    (completePayment as jest.Mock).mockResolvedValue(mockCompletedPayment);
    (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);
    (createOrUpdatePaymentCrossReference as jest.Mock).mockResolvedValue({});
    (platformAPIClient.post as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

    await expect(processPaymentCompletion(mockPiPaymentId, mockTxId))
    .rejects
    .toThrow('Pi Platform API timeout');

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxId);
    expect(updatePaidOrder).toHaveBeenCalledWith(mockCompletedPayment._id);
    expect(createOrUpdatePaymentCrossReference).toHaveBeenCalledWith(
      mockOrder._id, 
      {
        u2aPaymentId: mockCompletedPayment._id,
        u2uStatus: U2UPaymentStatus.U2ACompleted,
        a2uPaymentId: null
      }
    );
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxId });
    expect(createA2UPayment).not.toHaveBeenCalled();
  });

  it('should throw error if notifying Pi Platform of payment completion for Membership fails', async () => {
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
    (completePayment as jest.Mock).mockResolvedValue({ ...mockCompletedPayment, payment_type: PaymentType.Membership });
    (platformAPIClient.post as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

    await expect(processPaymentCompletion(mockPiPaymentId, mockTxId))
    .rejects
    .toThrow('Pi Platform API timeout');

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxId);
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(createOrUpdatePaymentCrossReference).not.toHaveBeenCalled();
    expect(createA2UPayment).not.toHaveBeenCalled();
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxId });
  });

  it('should throw error if the total amount for the order is missing for BuyerCheckout', async () => {    
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
    (completePayment as jest.Mock).mockResolvedValue(mockCompletedPayment);
    (updatePaidOrder as jest.Mock).mockResolvedValue({ ...mockOrder, total_amount: undefined });

    await expect(processPaymentCompletion(mockPiPaymentId, mockTxId))
    .rejects
    .toThrow("Order total_amount is undefined");

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxId);
    expect(updatePaidOrder).toHaveBeenCalledWith(mockCompletedPayment._id);
    expect(createOrUpdatePaymentCrossReference).toHaveBeenCalledWith(
      mockOrder._id, 
      {
        u2aPaymentId: mockCompletedPayment._id,
        u2uStatus: U2UPaymentStatus.U2ACompleted,
        a2uPaymentId: null
      }
    );
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxId });
    expect(createA2UPayment).not.toHaveBeenCalled();
  });

  it('should process Membership payment and not create A2U payment', async () => {
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: {} });
    (completePayment as jest.Mock).mockResolvedValue({ ...mockCompletedPayment, payment_type: PaymentType.Membership });

    const result = await processPaymentCompletion(mockPiPaymentId, mockTxId);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
    expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxId);
    expect(updatePaidOrder).not.toHaveBeenCalled();
    expect(createOrUpdatePaymentCrossReference).not.toHaveBeenCalled();
    expect(createA2UPayment).not.toHaveBeenCalled();
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxId });
    expect(result).toEqual({
      success: true,
      message: `Payment completed with id ${ mockPiPaymentId }`
    });
  });
});

describe('processPaymentCancellation function', () => {
  const mockPiPaymentId = 'piPaymentId1_TEST';
  const mockTxid = 'txid1_TEST';

  const mockCancelledPayment = {
    _id: 'payment_idTEST',
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

  it('should cancel BuyerCheckout payment and related order successfully', async () => {
    (cancelPayment as jest.Mock).mockResolvedValue(mockCancelledPayment);
    (cancelOrder as jest.Mock).mockResolvedValue({});
    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processPaymentCancellation(mockPiPaymentId);

    expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(cancelOrder).toHaveBeenCalledWith(mockCancelledPayment._id);
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/cancel`);
    expect(result).toEqual({
      success: true,
      message: `Payment cancelled with id ${ mockPiPaymentId }`,
    });
  });

  it('should cancel Membership payment and skip order cancellation', async () => {
    (cancelPayment as jest.Mock).mockResolvedValue({ ...mockCancelledPayment, payment_type: PaymentType.Membership });
    (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

    const result = await processPaymentCancellation(mockPiPaymentId);

    expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(cancelOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/cancel`);
    expect(result).toEqual({
      success: true,
      message: `Payment cancelled with id ${ mockPiPaymentId }`,
    });
  });

  it('should throw error if no corresponding payment to cancel is found', async () => {
    (cancelPayment as jest.Mock).mockResolvedValue(null);

    await expect(processPaymentCancellation(mockPiPaymentId)).rejects.toThrow(
      `No payment found with id ${ mockPiPaymentId }`
    );

    expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
    expect(cancelOrder).not.toHaveBeenCalled();
    expect(platformAPIClient.post).not.toHaveBeenCalled();
  });
});