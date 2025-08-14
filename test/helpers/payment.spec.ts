import axios from "axios";
import { Types } from "mongoose";
import { platformAPIClient } from "../../src/config/platformAPIclient";
import * as paymentModule from "../../src/helpers/payment";
import { FulfillmentType } from "../../src/models/enums/fulfillmentType";
import { OrderStatusType } from "../../src/models/enums/orderStatusType";
import { MembershipClassType } from "../../src/models/enums/membershipClassType";
import { PaymentType } from "../../src/models/enums/paymentType";
import { updateOrRenewMembership } from "../../src/services/membership.service";
import { 
  createOrder, 
  updatePaidOrder 
} from "../../src/services/order.service";
import { 
  completePayment, 
  createPayment, 
  getPayment 
} from "../../src/services/payment.service";
import { 
  IOrder,
  IPayment, 
  NewPayment, 
  PaymentDTO, 
  PaymentInfo, 
  U2AMetadata
} from "../../src/types";

jest.mock('axios');
jest.mock('../../src/config/platformAPIclient', () => ({
  platformAPIClient: {
    get: jest.fn(),
    post: jest.fn()
  },
}));
jest.mock('../../src/models/Seller');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/User');
jest.mock('../../src/services/membership.service');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/services/order.service');

function initializePayments(
  payment: IPayment, 
  paymentDTO: PaymentDTO, 
  metadata: U2AMetadata = {} as U2AMetadata
) {
  (getPayment as jest.Mock).mockResolvedValue(payment);

  (axios.create as jest.Mock).mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: { memo: payment.pi_payment_id } }),
  });

  (platformAPIClient.get as jest.Mock).mockResolvedValue({ data: { ...paymentDTO, metadata } });
}

describe('processIncompletePayment function', () => {
  const mockPaymentInfo: PaymentInfo = {
    identifier: 'paymentInfo_TEST',
    transaction: {
      txid: 'txid_TEST',
      _link: 'https://api.blockchain.pi/payment_TEST/',
    },
  };

  const mockPayment: IPayment = {
    user_id: new Types.ObjectId() as any,
    pi_payment_id: mockPaymentInfo.identifier,
    amount: Types.Decimal128.fromString("100.00"),
    paid: false,
    memo: "paymentInfo_TEST", // pi_payment_id
    txid: "txid_TEST",
    cancelled: false,
    createdAt: new Date()
  } as unknown as IPayment;

  const mockPaymentDTO: PaymentDTO = {
    amount: 100,
    user_uid: "userUid_TEST",
    created_at: new Date().toISOString(),
    identifier: mockPaymentInfo.identifier,
    memo: "paymentInfo_TEST", // pi_payment_id
    status: {
      developer_approved: true,
      transaction_verified: true,
      developer_completed: false,
      cancelled: false,
      user_cancelled: false,
    },
    to_address: "Test Pi Address",
    transaction: {
      txid: "txid_TEST",
      verified: true,
      _link: "https://example.com",
    },
  } as unknown as PaymentDTO;

  it('should throw error if no corresponding incomplete payment is found', async () => {
    (getPayment as jest.Mock).mockResolvedValue(null);

    await expect(paymentModule.processIncompletePayment(mockPaymentInfo))
      .rejects.toThrow("Finding incomplete payment failed");

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).not.toHaveBeenCalled();
  });

  it('should throw error if blockchain memo does not match the internal paymentID', async () => {
    (getPayment as jest.Mock).mockResolvedValue(mockPayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: 'unmatched memo' } }),
    });

    await expect(paymentModule.processIncompletePayment(mockPaymentInfo))
      .rejects.toThrow("Unable to find payment on the Pi Blockchain");

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
  });

  it('should throw an error if Horizon API request fails', async () => {
    const mockError = new Error('Horizon API timeout');
    
    (getPayment as jest.Mock).mockResolvedValue(mockPayment);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockRejectedValue(mockError),
    });

    await expect(paymentModule.processIncompletePayment(mockPaymentInfo))
      .rejects.toThrow(mockError);

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
  });

  it('should throw an error if no transaction ID exists [completePiPayment function]', async () => {
    const mockPayment_noTxnId = {
      ...mockPayment,
      txid: null
    } as unknown as IPayment;

    const mockPaymentInfo_noTxnId = {
      ...mockPaymentInfo,
      transaction: {
        txid: null
      }
    } as unknown as PaymentInfo;

    const mockError = new Error('No transaction ID');

    initializePayments(mockPayment_noTxnId, mockPaymentDTO);

    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { memo: "paymentInfo_TEST" } }),
    });

    await expect(paymentModule.processIncompletePayment(mockPaymentInfo_noTxnId))
      .rejects.toThrow(mockError);

    expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
    expect(axios.create).toHaveBeenCalled();
    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPaymentInfo.identifier }`);
  });

  describe('BuyerCheckout payments', () => {
    const mockOrder: IOrder = {
      _id: new Types.ObjectId() as any,
      buyer_id: new Types.ObjectId(),
      seller_id: new Types.ObjectId(),
      payment_id: new Types.ObjectId(),
      total_amount: Types.Decimal128.fromString("100.00"),
      status: OrderStatusType.Pending,
      is_paid: true,
      is_fulfilled: false,
      fulfillment_type: FulfillmentType.CollectionByBuyer,
      seller_fulfillment_description: "Test seller description",
      buyer_fulfillment_description: "Test buyer description",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IOrder;

    const mockPayment_buyerCheckout = {
      ...mockPayment,
      payment_type: PaymentType.BuyerCheckout
    } as unknown as IPayment;

    it('should complete BuyerCheckout payment and update paid order', async () => {
      initializePayments(mockPayment_buyerCheckout, mockPaymentDTO);

      (completePayment as jest.Mock).mockResolvedValue({
        ...mockPayment_buyerCheckout,
        paid: true
      });

      (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);

      (platformAPIClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await paymentModule.processIncompletePayment(mockPaymentInfo);

      expect(result).toEqual({
        success: true,
        message: `Payment completed from incomplete payment with id ${ mockPaymentInfo.identifier }`
      });
      expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
      expect(axios.create).toHaveBeenCalled();
      expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPaymentInfo.identifier }`);
      expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction?.txid);
      expect(updatePaidOrder).toHaveBeenCalledWith(mockPayment_buyerCheckout._id);
      expect(platformAPIClient.post).toHaveBeenCalledWith(
        `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
        { txid: 'txid_TEST' }
      );
    });

    it('should throw an error if Pi payment fails to successfully complete', async () => {
      const mockError = new Error('Failed to mark U2A payment completed on Pi blockchain');
      
      initializePayments(mockPayment_buyerCheckout, mockPaymentDTO);

      (completePayment as jest.Mock).mockResolvedValue({
        ...mockPayment_buyerCheckout,
        paid: true
      });

      (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);

      (platformAPIClient.post as jest.Mock).mockResolvedValue({ status: 500 });

      await expect(paymentModule.processIncompletePayment(mockPaymentInfo)).rejects.toThrow(mockError);

      expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
      expect(axios.create).toHaveBeenCalled();
      expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPaymentInfo.identifier }`);
      expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction?.txid);
      expect(updatePaidOrder).toHaveBeenCalledWith(mockPayment_buyerCheckout._id);
      expect(platformAPIClient.post).toHaveBeenCalledWith(
        `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
        { txid: 'txid_TEST' }
      );
    });
  });

  describe('Membership payments', () => {
    const u2aMetadata: U2AMetadata = {
      payment_type: PaymentType.Membership,
      MembershipPayment: {
        membership_class: MembershipClassType.GOLD
      },
    } as U2AMetadata;

    const mockPayment_membership = {
      ...mockPayment,
      payment_type: PaymentType.Membership
    } as unknown as IPayment;

    it('should complete Membership payment and update or renew membership', async () => {
      initializePayments(mockPayment_membership, mockPaymentDTO, u2aMetadata);

      (completePayment as jest.Mock).mockResolvedValue({
        ...mockPayment_membership,
        paid: true
      });

      (updateOrRenewMembership as jest.Mock).mockResolvedValue({});

      (platformAPIClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await paymentModule.processIncompletePayment(mockPaymentInfo);

      expect(result).toEqual({
        success: true,
        message: `Payment completed from incomplete payment with id ${ mockPaymentInfo.identifier }`
      });
      expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
      expect(axios.create).toHaveBeenCalled();
      expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPaymentInfo.identifier }`);
      expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction?.txid);
      expect(updateOrRenewMembership).toHaveBeenCalledWith(
        mockPaymentDTO.user_uid, 
        u2aMetadata.MembershipPayment?.membership_class
      );
      expect(platformAPIClient.post).toHaveBeenCalledWith(
        `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
        { txid: 'txid_TEST' }
      );
    });

    it('should throw an error if Pi payment fails to successfully complete', async () => {
      const mockError = new Error('Failed to mark U2A payment completed on Pi blockchain');
      
      initializePayments(mockPayment_membership, mockPaymentDTO, u2aMetadata);

      (completePayment as jest.Mock).mockResolvedValue({
        ...mockPayment_membership,
        paid: true
      });

      (updateOrRenewMembership as jest.Mock).mockResolvedValue({});

      (platformAPIClient.post as jest.Mock).mockResolvedValue({ status: 500 });

      await expect(paymentModule.processIncompletePayment(mockPaymentInfo)).rejects.toThrow(mockError);

      expect(getPayment).toHaveBeenCalledWith(mockPaymentInfo.identifier);
      expect(axios.create).toHaveBeenCalled();
      expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPaymentInfo.identifier }`);
      expect(completePayment).toHaveBeenCalledWith(mockPaymentInfo.identifier, mockPaymentInfo.transaction?.txid);
      expect(updateOrRenewMembership).toHaveBeenCalledWith(
        mockPaymentDTO.user_uid, 
        u2aMetadata.MembershipPayment?.membership_class
      );
      expect(platformAPIClient.post).toHaveBeenCalledWith(
        `/v2/payments/${ mockPaymentInfo.identifier }/complete`,
        { txid: 'txid_TEST' }
      );
    });
  });
});

describe('processPaymentApproval function', () => {
  const mockOrder: IOrder = {
    _id: new Types.ObjectId() as any,
    buyer_id: new Types.ObjectId(),
    seller_id: new Types.ObjectId(),
    payment_id: new Types.ObjectId(),
    total_amount: Types.Decimal128.fromString("100.00"),
    status: OrderStatusType.Pending,
    is_paid: true,
    is_fulfilled: false,
    fulfillment_type: FulfillmentType.CollectionByBuyer,
    seller_fulfillment_description: "Test seller description",
    buyer_fulfillment_description: "Test buyer description",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as IOrder;
  
  const mockPayment: IPayment = {
    user_id: new Types.ObjectId() as any,
    pi_payment_id: 'paymentInfo_TEST',
    amount: Types.Decimal128.fromString("100.00"),
    paid: false,
    memo: "paymentInfo_TEST",
    txid: "txid_TEST",
    cancelled: false,
    createdAt: new Date()
  } as unknown as IPayment;

  const mockPaymentDTO: PaymentDTO = {
    amount: 100,
    user_uid: "userUid_TEST",
    created_at: new Date().toISOString(),
    identifier: 'paymentInfo_TEST',
    memo: "paymentInfo_TEST",
    status: {
      developer_approved: true,
      transaction_verified: true,
      developer_completed: false,
      cancelled: false,
      user_cancelled: false,
    },
    to_address: "Test Pi Address",
    transaction: {
      txid: "txid_TEST",
      verified: true,
      _link: "https://example.com",
    },
  } as unknown as PaymentDTO;

  const u2aMetadata: U2AMetadata = {
    OrderPayment: {
      seller: 'sellerid_TEST',
      buyer: 'buyerid_TEST',
      fulfillment_method: FulfillmentType.CollectionByBuyer,
      seller_fulfillment_description: 'Pickup from store',
      buyer_fulfillment_description: 'Will pickup tomorrow',
      items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
    },
  } as U2AMetadata;

  it('should process and approve a new BuyerCheckout payment successfully', async () => {    
    const u2aMetadata_buyerCheckout: U2AMetadata = {
      ...u2aMetadata,
      payment_type: PaymentType.BuyerCheckout,
    } as U2AMetadata;

    const mockNewPayment: NewPayment = {
      piPaymentId: mockPaymentDTO.identifier,
      buyerPiUid: mockPaymentDTO.user_uid,
      memo: mockPaymentDTO.memo,
      amount: mockPaymentDTO.amount,
      paymentType: u2aMetadata_buyerCheckout.payment_type
    };
    
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
      data: { 
        ...mockPaymentDTO, 
        metadata: u2aMetadata_buyerCheckout 
      } 
    });
    
    (getPayment as jest.Mock).mockResolvedValue(null);
    (createPayment as jest.Mock).mockResolvedValue(mockNewPayment);
    // Mock functions in checkoutProcess
    (createOrder as jest.Mock).mockResolvedValue(mockOrder);
    (platformAPIClient.post as jest.Mock).mockResolvedValue({});

    const result = await paymentModule.processPaymentApproval(mockPayment.pi_payment_id);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPayment.pi_payment_id }`);
    expect(getPayment).toHaveBeenCalledWith(mockPayment.pi_payment_id);
    expect(createPayment).toHaveBeenCalledWith(mockNewPayment);
    expect(createOrder).toHaveBeenCalledWith({
      buyerPiUid: u2aMetadata_buyerCheckout.OrderPayment?.buyer,
      sellerPiUid: u2aMetadata_buyerCheckout.OrderPayment?.seller,
      paymentId: mockPayment._id,
      totalAmount: mockPaymentDTO.amount.toString(),
      orderItems: u2aMetadata_buyerCheckout.OrderPayment?.items,
      status: OrderStatusType.Initialized,
      fulfillmentMethod: u2aMetadata_buyerCheckout.OrderPayment?.fulfillment_method,
      sellerFulfillmentDescription: u2aMetadata_buyerCheckout.OrderPayment?.seller_fulfillment_description,
      buyerFulfillmentDescription: u2aMetadata_buyerCheckout.OrderPayment?.buyer_fulfillment_description,
    });
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPayment.pi_payment_id }/approve`);
    expect(result).toEqual({
      success: true,
      message: `Payment approved with id ${ mockPayment.pi_payment_id }`,
    });
  });

  it('should return an unsuccessful message if payment already exists', async () => {
    const u2aMetadata_buyerCheckout: U2AMetadata = {
      ...u2aMetadata,
      payment_type: PaymentType.BuyerCheckout,
    } as U2AMetadata;
    
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
      data: { 
        ...mockPaymentDTO, 
        metadata: u2aMetadata_buyerCheckout 
      } 
    });
    
    (getPayment as jest.Mock).mockResolvedValue(mockPayment);

    // Spy on processPaymentError (mock implementation so we don't hit internals)
    const processPaymentErrorSpy = jest
      .spyOn(paymentModule, 'processPaymentError')
      .mockResolvedValue({
        success: true,
        message: `Payment Error with ID ${ mockPaymentDTO.identifier } handled and completed successfully`
    });

    const result = await paymentModule.processPaymentApproval(mockPayment.pi_payment_id);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPayment.pi_payment_id }`);
    expect(getPayment).toHaveBeenCalledWith(mockPayment.pi_payment_id);
    expect(processPaymentErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: mockPaymentDTO.identifier,
        transaction: mockPaymentDTO.transaction
      })
    );
    expect(result).toEqual({
      success: false,
      message: `Payment already exists with ID ${ mockPayment.pi_payment_id }`,
    });
  });

  it('should process and approve a new Membership payment successfully', async () => {
    const u2aMetadata_membership: U2AMetadata = {
      ...u2aMetadata,
      payment_type: PaymentType.Membership,
    } as U2AMetadata;

    const mockNewPayment: NewPayment = {
      piPaymentId: mockPaymentDTO.identifier,
      buyerPiUid: mockPaymentDTO.user_uid,
      memo: mockPaymentDTO.memo,
      amount: mockPaymentDTO.amount,
      paymentType: u2aMetadata_membership.payment_type
    };
    
    (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
      data: { 
        ...mockPaymentDTO, 
        metadata: u2aMetadata_membership 
      } 
    });
    
    (getPayment as jest.Mock).mockResolvedValue(null);
    (createPayment as jest.Mock).mockResolvedValue(mockNewPayment);

    (platformAPIClient.post as jest.Mock).mockResolvedValue({});

    const result = await paymentModule.processPaymentApproval(mockPayment.pi_payment_id);

    expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPayment.pi_payment_id }`);
    expect(getPayment).toHaveBeenCalledWith(mockPayment.pi_payment_id);
    expect(createPayment).toHaveBeenCalledWith(mockNewPayment);
    expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPayment.pi_payment_id }/approve`);
    expect(result).toEqual({
      success: true,
      message: `Payment approved with id ${ mockPayment.pi_payment_id }`,
    });
  });

  it('should throw error if processing payment approval fails', async () => {
    const mockError = new Error('Pi Platform API timeout');
    (platformAPIClient.get as jest.Mock).mockRejectedValue(mockError);

    await expect(paymentModule.processPaymentApproval(mockPayment.pi_payment_id)).rejects.toThrow('Pi Platform API timeout');
  });
});

describe('processPaymentCompletion function', () => {
  const mockPaymentId = "paymentInfo_TEST";
  const mockTxid = "txid_TEST";

  let completePiPaymentSpy: jest.SpyInstance;

  beforeEach(() => {
    completePiPaymentSpy = jest.spyOn(paymentModule as any, "completePiPayment");
  });

  it('should complete a payment successfully', async () => {
    completePiPaymentSpy.mockResolvedValueOnce(undefined);

    const result = await paymentModule.processPaymentCompletion(mockPaymentId, mockTxid);

    expect(completePiPaymentSpy).toHaveBeenCalledWith(mockPaymentId, mockTxid);
    expect(result).toEqual({
      success: true,
      message: `U2A Payment completed with id ${ mockPaymentId }`,
    });
  });

  it('should rethrow if completePiPayment throws a platform API error', async () => {
    const mockError = {
      response: {
        status: 500,
        data: { error: "Server Error" },
      },
      config: { url: "/v2/payments", method: "post" },
    };

    completePiPaymentSpy.mockRejectedValueOnce(mockError);

    await expect(
      paymentModule.processPaymentCompletion( mockPaymentId, mockTxid)
    ).rejects.toEqual(mockError);
  });

  it("should rethrow if completePiPayment throws an unhandled error", async () => {
    const mockError = new Error('Unexpected error');

    completePiPaymentSpy.mockRejectedValueOnce(mockError);

    await expect(
      paymentModule.processPaymentCompletion(mockPaymentId, mockTxid)
    ).rejects.toThrow(mockError.message);
  });
});


//   const mockPiPaymentId = 'payment1_TEST';
//   const mockOrder = { _id: 'order1_idTEST', status: OrderStatusType.Initialized };
//   const mockTxid = 'txid1_TEST';
//   const mockBuyer = { _id: 'buyer1_idTEST', pi_uid: 'buyer1_TEST' };
//   const mockSeller = { _id: 'seller1_idTEST', seller_id: 'seller1_TEST' };

//   const mockUser: IUser = {
//     pi_uid: mockBuyer.pi_uid,
//     pi_username: 'pi_usernameTEST',
//     user_name: 'pi_userTEST'
//   } as IUser;

//   const mockPayment = {
//     _id: mockPiPaymentId,
//     txid: mockTxid,
//     paid: false,
//     user_id: 'userId1_TEST',
//     amount: '100',
//     memo: 'Test Memo',
//     payment_type: PaymentType.BuyerCheckout,
//     cancelled: false,
//     createdAt: expect.any(Date)
//   };

//   it('should process and approve a new BuyerCheckout payment successfully', async () => { 
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.BuyerCheckout,
//         OrderPayment: {
//           seller: mockSeller._id,
//           buyer: mockBuyer._id,
//           fulfillment_method: FulfillmentType.CollectionByBuyer,
//           seller_fulfillment_description: 'Pickup from store',
//           buyer_fulfillment_description: 'Will pickup tomorrow',
//           items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
//         },
//       }
//     };

//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     // Mock no existing payment
//     (getPayment as jest.Mock).mockResolvedValue(null);

//     // Mock functions in checkoutProcess
//     (Seller.findOne as jest.Mock).mockResolvedValue(mockSeller);
//     (User.findOne as jest.Mock).mockResolvedValue(mockUser);
//     (createPayment as jest.Mock).mockResolvedValue(mockPayment);
//     (createOrder as jest.Mock).mockResolvedValue(mockOrder);

//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

//     const result = await processPaymentApproval(mockPiPaymentId);

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(getPayment).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(Seller.findOne).toHaveBeenCalledWith({ seller_id: currentPayment.metadata.OrderPayment?.seller });
//     expect(User.findOne).toHaveBeenCalledWith({ pi_uid: mockUser.pi_uid });
//     expect(createPayment).toHaveBeenCalledWith({
//       piPaymentId: mockPiPaymentId,
//       userId: mockBuyer.pi_uid,
//       memo: mockPayment.memo,
//       amount: mockPayment.amount,
//       paymentType: PaymentType.BuyerCheckout
//     });
//     expect(createOrder).toHaveBeenCalledWith({
//       buyerId: currentPayment.user_id,
//       sellerId: currentPayment.metadata.OrderPayment?.seller,
//       paymentId: mockPayment._id,
//       totalAmount: mockPayment.amount,
//       status: OrderStatusType.Initialized,
//       fulfillmentMethod: currentPayment.metadata.OrderPayment?.fulfillment_method,
//       sellerFulfillmentDescription: currentPayment.metadata.OrderPayment?.seller_fulfillment_description,
//       buyerFulfillmentDescription: currentPayment.metadata.OrderPayment?.buyer_fulfillment_description,
//     },
//       currentPayment.metadata.OrderPayment?.items,
//       currentPayment.user_id
//     );
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/approve`);
//     expect(result).toEqual({
//       success: true,
//       message: `Payment approved with id ${ mockPiPaymentId }`,
//     });
//   });

//   it('should process and approve a new Membership payment successfully', async () => {
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.Membership,
//         MembershipPayment: {
//           membership_class: MembershipClassType.GREEN
//         }
//       }
//     };

//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (getPayment as jest.Mock).mockResolvedValue(null);
//     (createPayment as jest.Mock).mockResolvedValue(mockPayment);
//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

//     const result = await processPaymentApproval(mockPiPaymentId);

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(getPayment).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(createPayment).toHaveBeenCalledWith({
//       piPaymentId: mockPiPaymentId,
//       userId: mockBuyer.pi_uid,
//       memo: mockPayment.memo,
//       amount: mockPayment.amount,
//       paymentType: PaymentType.Membership
//     });
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/approve`);
//     expect(result).toEqual({
//       success: true,
//       message: `Payment approved with id ${ mockPiPaymentId }`,
//     });
//   });

//   it('should throw error if processing payment approval fails', async () => {
//     const mockError = new Error('Pi Platform API timeout');
//     (platformAPIClient.get as jest.Mock).mockRejectedValue(mockError);
  
//     await expect(processPaymentApproval(mockPiPaymentId)).rejects.toThrow('Pi Platform API timeout');
//   });
// });

// describe('processPaymentCompletion function', () => {
//   const mockPiPaymentId = 'payment1_TEST';
//   const mockTxid = 'txid1_TEST';
//   const mockBuyer = { _id: 'buyer1_idTEST', pi_uid: 'buyer1_TEST' };
//   const mockSeller = { _id: 'seller1_idTEST', seller_id: 'seller1_TEST' };

//   const mockUser: IUser = {
//     pi_uid: mockBuyer.pi_uid,
//     pi_username: 'pi_usernameTEST',
//     user_name: 'pi_userTEST'
//   } as IUser;

//   const mockOrder = {
//     _id: 'order_idTEST',
//     buyer_id: mockBuyer._id,
//     seller_id: mockSeller._id,
//     total_amount: '20',
//     status: OrderStatusType.Pending
//   };

//   const mockMembership = {
//     user_id: mockBuyer._id,
//     pi_uid: mockBuyer.pi_uid,
//     membership_class: MembershipClassType.WHITE 
//   };

//   const mockPayment = {
//     _id: mockPiPaymentId,
//     txid: mockTxid,
//     paid: false,
//     user_id: 'userId1_TEST',
//     amount: '100',
//     memo: 'Test Memo',
//     payment_type: PaymentType.BuyerCheckout,
//     cancelled: false,
//     createdAt: expect.any(Date)
//   };

//   it('should process BuyerCheckout payment and create A2U payment successfully', async () => {
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.BuyerCheckout,
//         OrderPayment: {
//           seller: mockSeller._id,
//           buyer: mockBuyer._id,
//           fulfillment_method: FulfillmentType.CollectionByBuyer,
//           seller_fulfillment_description: 'Pickup from store',
//           buyer_fulfillment_description: 'Will pickup tomorrow',
//           items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
//         }
//       }
//     };

//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (completePayment as jest.Mock).mockResolvedValue({
//       _id: mockPiPaymentId,
//       pi_payment_id: mockPiPaymentId,
//       txid: mockTxid,
//       payment_type: PaymentType.BuyerCheckout,
//       paid: true
//     });
//     (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);
//     (createPaymentCrossReference as jest.Mock).mockResolvedValue({});
//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ 
//       status: 200,
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (createA2UPayment as jest.Mock).mockResolvedValue({});

//     const result = await processPaymentCompletion(mockPiPaymentId, mockTxid);

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
//     expect(updatePaidOrder).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(createPaymentCrossReference).toHaveBeenCalledWith(
//       mockOrder._id, 
//       {
//         u2aPaymentId: mockPayment._id,
//         u2uStatus: U2UPaymentStatus.U2ACompleted,
//         a2uPaymentId: null
//       }
//     );
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxid });
//     expect(createA2UPayment).toHaveBeenCalledWith({
//       orderId: mockOrder._id,
//       sellerId: mockOrder.seller_id,
//       buyerId: mockOrder.buyer_id,
//       amount: mockOrder.total_amount,
//       paymentType: PaymentType.BuyerCheckout,
//       memo: mockPayment.memo
//     });
//     expect(result).toEqual({
//       success: true,
//       message: `Payment completed with id ${ mockPiPaymentId }`
//     });
//   });

//   it('should process Membership payment and update/ renew membership successfully', async () => {
//     // Mock platformAPIClient.get
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.Membership,
//         MembershipPayment: {
//           membership_class: MembershipClassType.WHITE
//         }
//       }
//     };

//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (completePayment as jest.Mock).mockResolvedValue({
//       _id: mockPiPaymentId,
//       pi_payment_id: mockPiPaymentId,
//       txid: mockTxid,
//       payment_type: PaymentType.Membership,
//       paid: true
//     });
//     (updateOrRenewMembership as jest.Mock).mockResolvedValue(mockMembership);
//     (createPaymentCrossReference as jest.Mock).mockResolvedValue({});
//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ 
//       status: 200,
//       data: { } 
//     });

//     const result = await processPaymentCompletion(mockPiPaymentId, mockTxid);

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
//     expect(updateOrRenewMembership).toHaveBeenCalledWith(currentPayment.user_id, MembershipClassType.WHITE);
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxid });
//     expect(result).toEqual({
//       success: true,
//       message: `Payment completed with id ${ mockPiPaymentId }`,
//       membership: mockMembership
//     });
//   });

//   it('should throw error if confirming payment via Pi Platform fails', async () => {
//     (platformAPIClient.get as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

//     await expect(processPaymentCompletion(mockPiPaymentId, mockTxid))
//     .rejects
//     .toThrow('Pi Platform API timeout');

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(completePayment).not.toHaveBeenCalled();
//     expect(updatePaidOrder).not.toHaveBeenCalled();
//     expect(createPaymentCrossReference).not.toHaveBeenCalled();
//     expect(platformAPIClient.post).not.toHaveBeenCalled();
//     expect(createA2UPayment).not.toHaveBeenCalled();
//   });

//   it('should throw error if notifying Pi Platform of payment completion for BuyerCheckout fails', async () => {
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.BuyerCheckout,
//         OrderPayment: {
//           seller: mockSeller._id,
//           buyer: mockBuyer._id,
//           fulfillment_method: FulfillmentType.CollectionByBuyer,
//           seller_fulfillment_description: 'Pickup from store',
//           buyer_fulfillment_description: 'Will pickup tomorrow',
//           items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
//         }
//       }
//     };
    
//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (completePayment as jest.Mock).mockResolvedValue({
//       _id: mockPiPaymentId,
//       pi_payment_id: mockPiPaymentId,
//       txid: mockTxid,
//       payment_type: PaymentType.BuyerCheckout,
//       paid: true
//     });
//     (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);
//     (createPaymentCrossReference as jest.Mock).mockResolvedValue({});
//     (platformAPIClient.post as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

//     await expect(processPaymentCompletion(mockPiPaymentId, mockTxid))
//     .rejects
//     .toThrow('Pi Platform API timeout');

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
//     expect(updatePaidOrder).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(createPaymentCrossReference).toHaveBeenCalledWith(
//       mockOrder._id, 
//       {
//         u2aPaymentId: mockPayment._id,
//         u2uStatus: U2UPaymentStatus.U2ACompleted,
//         a2uPaymentId: null
//       }
//     );
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxid });
//     expect(createA2UPayment).not.toHaveBeenCalled();
//   });

//   it('should throw error if notifying Pi Platform of payment completion for Membership fails', async () => {
//     const currentPayment: PaymentDataType = {
//       user_id: mockUser.pi_uid,
//       identifier: mockPayment._id,
//       amount: mockPayment.amount,
//       memo: mockPayment.memo,
//       metadata: {
//         payment_type: PaymentType.BuyerCheckout,
//         OrderPayment: {
//           seller: mockSeller._id,
//           buyer: mockBuyer._id,
//           fulfillment_method: FulfillmentType.CollectionByBuyer,
//           seller_fulfillment_description: 'Pickup from store',
//           buyer_fulfillment_description: 'Will pickup tomorrow',
//           items: [{ itemId: 'mockItemId1_TEST', quantity: 2 }],
//         }
//       }
//     };

//     (platformAPIClient.get as jest.Mock).mockResolvedValue({ 
//       data: {
//         ...currentPayment,
//         transaction: {
//           txid: mockTxid,
//           _link: 'https://api.blockchain.pi/payment_TEST/'
//         } 
//       }
//     });
//     (completePayment as jest.Mock).mockResolvedValue({
//       _id: mockPiPaymentId,
//       pi_payment_id: mockPiPaymentId,
//       txid: mockTxid,
//       payment_type: PaymentType.BuyerCheckout,
//       paid: true
//     });
//     (updatePaidOrder as jest.Mock).mockResolvedValue(mockOrder);
//     (createPaymentCrossReference as jest.Mock).mockResolvedValue({});
//     (platformAPIClient.post as jest.Mock).mockRejectedValue(new Error('Pi Platform API timeout'));

//     await expect(processPaymentCompletion(mockPiPaymentId, mockTxid))
//     .rejects
//     .toThrow('Pi Platform API timeout');

//     expect(platformAPIClient.get).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }`);
//     expect(completePayment).toHaveBeenCalledWith(mockPiPaymentId, mockTxid);
//     expect(updatePaidOrder).toHaveBeenCalledWith(mockPayment._id);
//     expect(createPaymentCrossReference).toHaveBeenCalledWith(
//       mockOrder._id, 
//       {
//         u2aPaymentId: mockPayment._id,
//         u2uStatus: U2UPaymentStatus.U2ACompleted,
//         a2uPaymentId: null
//       }
//     );
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/complete`, { txid: mockTxid });
//     expect(createA2UPayment).not.toHaveBeenCalled();
//   });
// });

// describe('processPaymentCancellation function', () => {
//   const mockPiPaymentId = 'piPaymentId1_TEST';
//   const mockTxid = 'txid1_TEST';

//   const mockCancelledPayment = {
//     _id: 'payment_idTEST',
//     pi_payment_id: mockPiPaymentId,
//     txid: mockTxid,
//     paid: true,
//     user_id: 'userId1_TEST',
//     amount: '100',
//     memo: 'Test Memo',
//     payment_type: PaymentType.BuyerCheckout,
//     cancelled: false,
//     createdAt: expect.any(Date)
//   };

//   it('should cancel BuyerCheckout payment and related order successfully', async () => {
//     (cancelPayment as jest.Mock).mockResolvedValue(mockCancelledPayment);
//     (cancelOrder as jest.Mock).mockResolvedValue({});
//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

//     const result = await processPaymentCancellation(mockPiPaymentId);

//     expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(cancelOrder).toHaveBeenCalledWith(mockCancelledPayment._id);
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/cancel`);
//     expect(result).toEqual({
//       success: true,
//       message: `Payment cancelled with id ${ mockPiPaymentId }`,
//     });
//   });

//   it('should cancel Membership payment and skip order cancellation', async () => {
//     (cancelPayment as jest.Mock).mockResolvedValue({ ...mockCancelledPayment, payment_type: PaymentType.Membership });
//     (platformAPIClient.post as jest.Mock).mockResolvedValue({ data: {} });

//     const result = await processPaymentCancellation(mockPiPaymentId);

//     expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(cancelOrder).not.toHaveBeenCalled();
//     expect(platformAPIClient.post).toHaveBeenCalledWith(`/v2/payments/${ mockPiPaymentId }/cancel`);
//     expect(result).toEqual({
//       success: true,
//       message: `Payment cancelled with id ${ mockPiPaymentId }`,
//     });
//   });

//   it('should throw error if no corresponding payment to cancel is found', async () => {
//     (cancelPayment as jest.Mock).mockResolvedValue(null);

//     await expect(processPaymentCancellation(mockPiPaymentId)).rejects.toThrow(
//       `No payment found with id ${ mockPiPaymentId }`
//     );

//     expect(cancelPayment).toHaveBeenCalledWith(mockPiPaymentId);
//     expect(cancelOrder).not.toHaveBeenCalled();
//     expect(platformAPIClient.post).not.toHaveBeenCalled();
//   });
// });