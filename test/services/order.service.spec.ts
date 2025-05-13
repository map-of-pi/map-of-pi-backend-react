import mongoose, { Types } from "mongoose";
import Order from "../../src/models/Order";
import OrderItem from "../../src/models/OrderItem";
import SellerItem from "../../src/models/SellerItem";
import { FulfillmentType } from "../../src/models/enums/fulfillmentType";
import { OrderStatusType } from "../../src/models/enums/orderStatusType";
import { OrderItemStatusType } from "../../src/models/enums/orderItemStatusType";
import { NewOrder, PickedItems } from "../../src/types";
import { 
  createOrder
} from '../../src/services/order.service';

describe('createOrder function', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };  

  beforeEach(() => {
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const orderData: NewOrder = {
    buyerId: 'buyerId_TEST',
    sellerId: 'sellerId_TEST',
    paymentId: 'paymentId_TEST',
    totalAmount: '100',
    status: OrderStatusType.Pending,
    fulfillmentMethod: FulfillmentType.DeliveredToBuyer,
    sellerFulfillmentDescription: 'Ships in 2 days',
    buyerFulfillmentDescription: 'Leave at door',
  };

  const orderItems: PickedItems[] = [
    { itemId: 'item1_TEST', quantity: 2 },
    { itemId: 'item2_TEST', quantity: 1 },
  ];

  it('should create an order and insert order items successfully', async () => {
    const mockSavedOrder = { 
      _id: 'orderId1_TEST',
      ...orderData,
      is_paid: false,
      is_fulfilled: false, 
    };

    // Mock order.save()
    jest.spyOn(Order.prototype, 'save').mockResolvedValue(mockSavedOrder);

    // Mock SellerItem.find().lean()
    jest.spyOn(SellerItem, 'find').mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue([
        { _id: 'item1_TEST', price: 10 },
        { _id: 'item2_TEST', price: 80 },
      ]),
    } as any);

    // Mock OrderItem.insertMany
    jest.spyOn(OrderItem, 'insertMany').mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        order_id: mockSavedOrder._id,
        seller_item_id: 'item1_TEST',
        quantity: 2,
        subtotal: Types.Decimal128.fromString('20'),
        status: OrderItemStatusType.Pending
      },
      {
        _id: new Types.ObjectId(),
        order_id: mockSavedOrder._id,
        seller_item_id: 'item2_TEST',
        quantity: 1,
        subtotal: Types.Decimal128.fromString('80'),
        status: OrderItemStatusType.Pending,
      }
    ] as any); 

    const result = await createOrder(orderData, orderItems);

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(OrderItem.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          order_id: 'orderId1_TEST',
          seller_item_id: 'item1_TEST',
          quantity: 2,
          subtotal: 20,
          status: OrderItemStatusType.Pending
        }),
        expect.objectContaining({
          order_id: 'orderId1_TEST',
          seller_item_id: 'item2_TEST',
          quantity: 1,
          subtotal: 80,
          status: OrderItemStatusType.Pending
        }),
      ]),
      { session: mockSession }
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual(mockSavedOrder);
  });

  it('should throw an error if order.save() returns null', async () => {
    jest.spyOn(Order.prototype, 'save').mockResolvedValue(null);
  
    await expect(createOrder(orderData, orderItems)).rejects.toThrow('Failed to create order');
  
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should throw an error if a seller item is not found', async () => {
    const mockSavedOrder = { 
      _id: 'orderId2_TEST',
      ...orderData,
      is_paid: false,
      is_fulfilled: false, 
    };
  
    jest.spyOn(Order.prototype, 'save').mockResolvedValue(mockSavedOrder);
  
    // Return only one item even though two were expected
    jest.spyOn(SellerItem, 'find').mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue([
        { _id: 'item1_TEST', price: 10 },
        // item2_TEST is missing
      ]),
    } as any);
  
    await expect(createOrder(orderData, orderItems)).rejects.toThrow('Failed to find associated seller item');
  
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should abort transaction and throw if OrderItem.insertMany fails', async () => {
    const mockSavedOrder = { 
      _id: 'orderId3_TEST',
      ...orderData,
      is_paid: false,
      is_fulfilled: false, 
    };
  
    jest.spyOn(Order.prototype, 'save').mockResolvedValue(mockSavedOrder);
  
    jest.spyOn(SellerItem, 'find').mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue([
        { _id: 'item1_TEST', price: 10 },
        { _id: 'item2_TEST', price: 80 },
      ]),
    } as any);
  
    jest.spyOn(OrderItem, 'insertMany').mockRejectedValue(new Error('Mock database error'));
  
    await expect(createOrder(orderData, orderItems)).rejects.toThrow('Mock database error');
  
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});