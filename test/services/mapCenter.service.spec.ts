import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getMapCenterById } from '../../src/services/mapCenter.service';
import UserSettings from '../../src/models/UserSettings';
import Seller from '../../src/models/Seller';
import { IUserSettings, ISeller } from '../../src/types';

let mongoServer: MongoMemoryServer;

// Mock data for UserSettings and Seller
const mockUserSettings = [
  {
    user_settings_id: '0a0a0a-0a0a-0a0a',
    user_name: 'Test User', // Add the required user_name field
    search_map_center: { type: 'Point', coordinates: [-74.0060, 40.7128] }
  }
] as IUserSettings[];

const mockSellers = [
  {
    seller_id: '0a0a0a-0a0a-0a0a',
    sell_map_center: { type: 'Point', coordinates: [-118.2437, 34.0522] }
  }
] as ISeller[];


beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test' });

  // Insert mock data for UserSettings and Seller models
  await UserSettings.insertMany(mockUserSettings);
  await Seller.insertMany(mockSellers);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('getMapCenterById function', () => {
  it('should fetch search and sell map centers associated with the user ID', async () => {
    const result = await getMapCenterById('0a0a0a-0a0a-0a0a');

    expect(result).toBeDefined();
    expect(result).toEqual({
      search_map_center: mockUserSettings[0].search_map_center,
      sell_map_center: mockSellers[0].sell_map_center
    });
  });

  it('should return null if no map centers are found for the user ID', async () => {
    const result = await getMapCenterById('nonexistent-id');
    expect(result).toBeNull();
  });
});
