import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { registerOrUpdateSeller } from '../../src/services/seller.service';
import Seller from '../../src/models/Seller';
import { IUser, ISeller } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUser = {
  pi_uid: '123-456-7890',
  user_name: 'TestUser',
} as IUser;

const formData = {
  seller_id: mockUser.pi_uid,
  name: 'New Test Seller',
  description: 'New Test Description',
  seller_type: 'Test Seller',
  image: 'http://example.com/iamge.jpg',
  address: '123 Test Ave. Test City',
  sale_items: 'Test Sale Items',
  sell_map_center: { type: 'Point', coordinates: [-73.856077, 40.848447] },
  order_online_enabled_pref: true
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('registerOrUpdateSeller function', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register a new seller', async () => {
    jest.spyOn(Seller, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(null) // Return null to simulate no existing seller
    } as any);

    // mock the save function to return the newly created seller
    const mockSave = jest.fn().mockResolvedValue({
      ...formData,
      trust_meter_rating: 100,
      average_rating: mongoose.Types.Decimal128.fromString('5.0')
    })
    jest.spyOn(Seller.prototype, 'save').mockImplementation(mockSave);

    const result = await registerOrUpdateSeller(mockUser, formData, formData.image);
    
    expect(result).toHaveProperty('seller_id', mockUser.pi_uid);
    expect(result).toHaveProperty('name', formData.name);
    expect(result).toHaveProperty('description', formData.description);
    expect(result).toHaveProperty('seller_type', formData.seller_type);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('address', formData.address);
    expect(result).toHaveProperty('sale_items', formData.sale_items);
    expect(result).toHaveProperty('sell_map_center', formData.sell_map_center);
    expect(result).toHaveProperty('order_online_enabled_pref', formData.order_online_enabled_pref);
  });

  it('should update an existing seller', async () => {
    const existingSellerData: Partial<ISeller> = {
      seller_id: mockUser.pi_uid,
      name: 'Existing Test Seller',
      description: 'Existing Test Description',
      seller_type: 'Existing Test Seller',
      image: 'http://example.com/iamge.jpg',
      address: '123 Test Ave. Test City',
      sale_items: 'Test Sale Items',
      sell_map_center: { type: 'Point', coordinates: [-73.856077, 40.848447] },
      order_online_enabled_pref: false
    };

    jest.spyOn(Seller, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingSellerData)
    } as any);

    const updatedSellerData = {
      ...existingSellerData,
      name: formData.name,
      description: formData.description,
      seller_type: formData.seller_type,
      image: formData.image,
      address: formData.address,
      sale_items: formData.sale_items,
      sell_map_center: formData.sell_map_center,
      order_online_enabled_pref: formData.order_online_enabled_pref
    };

    jest.spyOn(Seller, 'findOneAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedSellerData)
    } as any);

    const result = await registerOrUpdateSeller(mockUser, updatedSellerData, updatedSellerData.image);

    expect(result).toHaveProperty('seller_id', mockUser.pi_uid);
    expect(result).toHaveProperty('name', updatedSellerData.name);
    expect(result).toHaveProperty('description', updatedSellerData.description);
    expect(result).toHaveProperty('seller_type', updatedSellerData.seller_type);
    expect(result).toHaveProperty('image', updatedSellerData.image);
    expect(result).toHaveProperty('address', updatedSellerData.address);
    expect(result).toHaveProperty('sale_items', updatedSellerData.sale_items);
    expect(result).toHaveProperty('sell_map_center', updatedSellerData.sell_map_center);
    expect(result).toHaveProperty('order_online_enabled_pref', updatedSellerData.order_online_enabled_pref);
  });
});
