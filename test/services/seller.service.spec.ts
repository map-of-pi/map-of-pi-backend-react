import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { getAllSellers } from '../../src/services/seller.service';
import Seller from '../../src/models/Seller';
import UserSettings from '../../src/models/UserSettings';
import { ISeller, ISellerWithSettings, IUserSettings } from '../../src/types';
import { SellerType } from '../../src/models/enums/sellerType';
import { TrustMeterScale } from '../../src/models/enums/trustMeterScale';

let mongoServer: MongoMemoryServer;

const mockSellers = [
  {
    seller_id: '0a0a0a-0a0a-0a0a',
    name: 'Test Seller 1',
    description: 'Test Seller 1 Description',
    seller_type: SellerType.Test,
    sell_map_center: { type: 'Point', coordinates: [-74.0060, 40.7128] }
  },
  {
    seller_id: '0b0b0b-0b0b-0b0b',
    name: 'Test Vendor 2',
    description: 'Test Vendor 2 Description',
    seller_type: SellerType.Inactive,
    sell_map_center: { type: 'Point', coordinates: [-118.2437, 34.0522] }
  },
  {
    seller_id: '0c0c0c-0c0c-0c0c',
    name: 'Test Vendor 3',
    description: 'Test Vendor 3 Description',
    seller_type: SellerType.Active,
    sell_map_center: { type: 'Point', coordinates: [-87.6298, 41.8781] }
  },
  {
    seller_id: '0d0d0d-0d0d-0d0d',
    name: 'Test Seller 4',
    description: 'Test Seller 4 Description',
    seller_type: SellerType.Inactive,
    sell_map_center: { type: 'Point', coordinates: [-122.4194, 37.7749] }
  },
  {
    seller_id: '0e0e0e-0e0e-0e0e',
    name: 'Test Vendor 5',
    description: 'Test Vendor 5 Description',
    seller_type: SellerType.Test,
    sell_map_center: { type: 'Point', coordinates: [-95.3698, 29.7604] }
  }
] as ISeller[];

const mockUserSettings = [
  {
    user_settings_id: '0a0a0a-0a0a-0a0a',
    user_name: 'Test One',
    email: 'test-one@test.com',
    phone_number: '111-111-1111',
    findme: 'deviceGPS',
    trust_meter_rating: TrustMeterScale.HUNDRED
  },
  {
    user_settings_id: '0b0b0b-0b0b-0b0b',
    user_name: 'Test Two',
    email: 'test-two@test.com',
    phone_number: '222-222-2222',
    findme: 'deviceGPS',
    trust_meter_rating: TrustMeterScale.EIGHTY
  },
  {
    user_settings_id: '0c0c0c-0c0c-0c0c',
    user_name: 'Test Three',
    email: 'test-three@test.com',
    phone_number: '333-333-3333',
    findme: 'deviceGPS',
    trust_meter_rating: TrustMeterScale.FIFTY
  },
  {
    user_settings_id: '0d0d0d-0d0d-0d0d',
    user_name: 'Test Four',
    email: 'test-four@test.com',
    phone_number: '444-444-4444',
    findme: 'deviceGPS',
    trust_meter_rating: TrustMeterScale.HUNDRED
  },
  {
    user_settings_id: '0e0e0e-0e0e-0e0e',
    user_name: 'Test Five',
    email: 'test-five@test.com',
    phone_number: '555-555-5555',
    findme: 'deviceGPS',
    trust_meter_rating: TrustMeterScale.EIGHTY
  }
] as IUserSettings[];

// Helper function to assert that sellers and their user settings are correctly merged
const assertSellersWithSettings = (
  result: ISellerWithSettings[],
  expectedSellers: ISeller[],
  mockUserSettings: IUserSettings[]
) => {
  expectedSellers.forEach((seller) => {
    const correspondingUserSettings = mockUserSettings.find(
      (settings) => settings.user_settings_id === seller.seller_id
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...seller,
          user_name: correspondingUserSettings?.user_name,
          email: correspondingUserSettings?.email,
          phone_number: correspondingUserSettings?.phone_number,
          findme: correspondingUserSettings?.findme,
          trust_meter_rating: correspondingUserSettings?.trust_meter_rating
        }),
      ])
    );
  });
};

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

describe('getAllSellers function', () => {
  it('should fetch all sellers when all parameters are empty', async () => {
    // filter seller records to exclude those with seller_type "Inactive"
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== SellerType.Inactive
    );

    const result = await getAllSellers();

    expect(result).toHaveLength(3);

    // invoke the helper function to assert that sellers are merged with settings
    assertSellersWithSettings(result, expectedMockSellers, mockUserSettings);
  });

  it('should fetch all applicable sellers when search query is provided and origin + radius params are empty', async () => {
    /* filter seller records to include those with description "Vendor" 
       + exclude those with seller_type "Inactive" */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.description.includes('Vendor') && 
      seller.seller_type !== SellerType.Inactive
    );

    const result = await getAllSellers(undefined, undefined, 'Vendor');

    expect(result).toHaveLength(2);

    // invoke the helper function to assert that sellers are merged with settings
    assertSellersWithSettings(result, expectedMockSellers, mockUserSettings);
  });

  it('should fetch all applicable sellers when origin + radius are provided and search query param is empty', async () => { 
    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with sell_map_center within geospatial radius */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== SellerType.Inactive &&
      seller.sell_map_center.type === 'Point' &&
      seller.sell_map_center.coordinates[0] === -74.0060 &&
      seller.sell_map_center.coordinates[1] === 40.7128
    );

    const result = await getAllSellers({ lat: 40.7128, lng: -74.0060 }, 10, undefined);

    expect(result).toHaveLength(1);

    // invoke the helper function to assert that sellers are merged with settings
    assertSellersWithSettings(result, expectedMockSellers, mockUserSettings);
  });

  it('should fetch all applicable sellers when all parameters are provided', async () => { 
    /* filter seller records to exclude those with seller_type "Inactive"
       + include those with description "Vendor"
       + include those with sell_map_center within geospatial radius */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== SellerType.Inactive &&
      seller.description.includes('Vendor') &&
      seller.sell_map_center.type === 'Point' &&
      seller.sell_map_center.coordinates[0] === -74.0060 &&
      seller.sell_map_center.coordinates[1] === 40.7128
    );

    const result = await getAllSellers({ lat: 40.7128, lng: -74.0060 }, 10, 'Vendor');

    expect(result).toHaveLength(0);

    // invoke the helper function to assert that sellers are merged with settings
    assertSellersWithSettings(result, expectedMockSellers, mockUserSettings);
  });
});
