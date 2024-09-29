import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Seller from '../../src/models/Seller';
import UserSettings from '../../src/models/UserSettings';
import { SellerType } from '../../src/models/enums/sellerType';
import { getMapCenterById, createOrUpdateMapCenter } from '../../src/services/mapCenter.service';

let mongoServer: MongoMemoryServer;

const mockSellers = [
  {
    seller_id: '0a0a0a-0a0a-0a0a',
    name: 'Test Seller A',
    seller_type: SellerType.Test,
    sell_map_center: { type: 'Point', coordinates: [-118.2437, 34.0522] }
  }
];

const mockUserSettings = [
  {
    user_settings_id: '0b0b0b-0b0b-0b0b',
    user_name: 'Test Seller B',
    search_map_center: { type: 'Point', coordinates: [-74.0060, 40.7128] }
  }
];

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });

    // initialize in-memory MongoDB by inserting mock data records
    await Seller.insertMany(mockSellers);
    await UserSettings.insertMany(mockUserSettings);
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('getMapCenterById function', () => {
  it('should fetch the sell map center for the given seller ID', async () => {
    const result = await getMapCenterById('0a0a0a-0a0a-0a0a', 'sell');

    const expectedMockSeller = mockSellers.find(
      seller => seller.seller_id === '0a0a0a-0a0a-0a0a'
    );

    expect(result).toBeDefined();
    // assert that the result matches the expected sell map center
    expect(result).toEqual(expect.objectContaining(expectedMockSeller!.sell_map_center));
  });

  it('should fetch the search map center for the given user settings ID', async () => {
    const result = await getMapCenterById('0b0b0b-0b0b-0b0b', 'search');
    
    const expectedMockUserSettings = mockUserSettings.find(
      settings => settings.user_settings_id === '0b0b0b-0b0b-0b0b'
    );

    expect(result).toBeDefined();
    // assert that the result matches the expected search map center
    expect(result).toEqual(expect.objectContaining(expectedMockUserSettings!.search_map_center));
  });

  it('should return null for a non-existent map center ID', async () => {
    const randomType = ['sell', 'search'][Math.floor(Math.random() * 2)];

    const result = await getMapCenterById('0x0x0x-0x0x-0x0x', randomType);
    expect(result).toBeNull();
  });
});

describe('createOrUpdateMapCenter function', () => {
  it('should update the appropriate search_map_center instance for the given user settings ID', async () => {
    const updatedSearchMapCenter = {
      map_center_id: '0b0b0b-0b0b-0b0b',
      latitude: 42.8781,
      longitude: -88.6298
    };

    const result = await createOrUpdateMapCenter(
      '0b0b0b-0b0b-0b0b',
      updatedSearchMapCenter.latitude,
      updatedSearchMapCenter.longitude,
      'search'
    ); 

    expect(result).toBeDefined();
    // assert that the search_map_center has been updated with new coordinates
    expect(result?.coordinates).toEqual([updatedSearchMapCenter.latitude, updatedSearchMapCenter.longitude]);
  });

  it('should update the appropriate sell_map_center instance for the given seller ID', async () => {
    const updatedSellMapCenter = {
      map_center_id: '0a0a0a-0a0a-0a0a',
      longitude: -88.6298,
      latitude: 42.8781
    };

    const result = await createOrUpdateMapCenter(
      '0a0a0a-0a0a-0a0a',
      updatedSellMapCenter.latitude,
      updatedSellMapCenter.longitude,
      'sell'
    ); 

    expect(result).toBeDefined();
    // assert that the sell_map_center has been updated with new coordinates
    expect(result?.coordinates).toEqual([updatedSellMapCenter.latitude, updatedSellMapCenter.longitude]);
  });
});
