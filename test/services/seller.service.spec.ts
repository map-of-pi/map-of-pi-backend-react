import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { getAllSellers } from '../../src/services/seller.service';
import Seller from '../../src/models/Seller';
import { ISeller } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockSellers = [
  {
    seller_id: '0a0a0a-0a0a-0a0a',
    name: 'Test Seller 1',
    description: 'Test Seller 1 Description',
    sale_items: 'Apples',
    seller_type: 'TestSeller',
    sell_map_center: { type: 'Point', coordinates: [-74.0060, 40.7128] }
  },
  {
    seller_id: '0b0b0b-0b0b-0b0b',
    name: 'Test Vendor 2',
    description: 'Test Vendor 2 Description',
    sale_items: 'Oranges',
    seller_type: 'CurrentlyNotSelling',
    sell_map_center: { type: 'Point', coordinates: [-118.2437, 34.0522] }
  },
  {
    seller_id: '0c0c0c-0c0c-0c0c',
    name: 'Test Vendor 3',
    description: 'Test Vendor 3 Description',
    sale_items: 'Bananas',
    seller_type: 'Pioneer',
    sell_map_center: { type: 'Point', coordinates: [-87.6298, 41.8781] }
  },
  {
    seller_id: '0d0d0d-0d0d-0d0d',
    name: 'Test Seller 4',
    description: 'Test Seller 4 Description',
    sale_items: 'Grapes',
    seller_type: 'CurrentlyNotSelling',
    sell_map_center: { type: 'Point', coordinates: [-122.4194, 37.7749] }
  },
  {
    seller_id: '0e0e0e-0e0e-0e0e',
    name: 'Test Vendor 5',
    description: 'Test Vendor 5 Description',
    sale_items: 'Peaches',
    seller_type: 'TestSeller',
    sell_map_center: { type: 'Point', coordinates: [-95.3698, 29.7604] }
  }
] as ISeller[];

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });

    // initialize in-memory MongoDB by inserting mock data records
    await Seller.insertMany(mockSellers);
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
    // filter seller records to exclude those with seller_type "CurrentlyNotSelling"
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== 'CurrentlyNotSelling'
    );

    const result = await getAllSellers();

    expect(result).toHaveLength(3);

    // assert if result contains all expected sellers
    expectedMockSellers.forEach(seller => {
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
        ...seller
      })]));
    });
  });

  it('should fetch all applicable sellers when search query is provided and origin + radius params are empty', async () => {
    /* filter seller records to include those with description "Vendor" 
       + exclude those with seller_type "CurrentlyNotSelling" */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.description.includes('Vendor') && 
      seller.seller_type !== 'CurrentlyNotSelling'
    );

    const result = await getAllSellers(undefined, undefined, 'Vendor');

    expect(result).toHaveLength(2);

    // assert if result contains all expected sellers
    expectedMockSellers.forEach(seller => {
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
        ...seller
      })]));
    });
  });

  it('should fetch all applicable sellers when origin + radius are provided and search query param is empty', async () => { 
    /* filter seller records to exclude those with seller_type "CurrentlyNotSelling" 
       + include those with sell_map_center within geospatial radius */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== 'CurrentlyNotSelling' &&
      seller.sell_map_center.type === 'Point' &&
      seller.sell_map_center.coordinates[0] === -74.0060 &&
      seller.sell_map_center.coordinates[1] === 40.7128
    );

    const result = await getAllSellers({ lat: 40.7128, lng: -74.0060 }, 10, undefined);

    expect(result).toHaveLength(1);

    // assert if result contains all expected sellers
    expectedMockSellers.forEach(seller => {
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
        ...seller
      })]));
    });
  });

  it('should fetch all applicable sellers when all parameters are provided', async () => { 
    /* filter seller records to exclude those with seller_type "CurrentlyNotSelling" 
       + include those with description "Vendor"
       + include those with sell_map_center within geospatial radius */
    const expectedMockSellers = mockSellers.filter(
      seller => seller.seller_type !== 'CurrentlyNotSelling' &&
      seller.description.includes('Vendor') &&
      seller.sell_map_center.type === 'Point' &&
      seller.sell_map_center.coordinates[0] === -74.0060 &&
      seller.sell_map_center.coordinates[1] === 40.7128
    );

    const result = await getAllSellers({ lat: 40.7128, lng: -74.0060 }, 10, 'Vendor');

    expect(result).toHaveLength(0);

    // assert if result contains all expected sellers
    expectedMockSellers.forEach(seller => {
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
        ...seller
      })]));
    });
  });
});
