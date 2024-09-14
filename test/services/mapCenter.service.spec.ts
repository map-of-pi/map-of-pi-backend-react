import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { getMapCenterById, createOrUpdateMapCenter } from '../../src/services/mapCenter.service';
import MapCenter from '../../src/models/MapCenter';
import { IMapCenter } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockMapCenters = [
  {
    map_center_id: '0a0a0a-0a0a-0a0a',
    search_map_center: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    sell_map_center: {
      latitude: 34.0522,
      longitude: -118.2437
    }
  },
  {
    map_center_id: '0b0b0b-0b0b-0b0b',
    search_map_center: {
      latitude: 41.8781,
      longitude: -87.6298
    },
    sell_map_center: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  }
 ] as IMapCenter[];

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });

    // initialize in-memory MongoDB by inserting mock data records
    await MapCenter.insertMany(mockMapCenters);
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
  it('should fetch the seller associated with the map center ID', async () => {
    const result = await getMapCenterById('0a0a0a-0a0a-0a0a');

    const expectedMockMapCenter = mockMapCenters.find(
      mapCenter => mapCenter.map_center_id === '0a0a0a-0a0a-0a0a'
    );

    expect(result).toBeDefined();
    // assert if result matches the expected map center object
    expect(result).toEqual(expect.objectContaining({
      ...expectedMockMapCenter
    }));
  });

  it('should not fetch any sellers not associated with the map center ID', async () => {
    const result = await getMapCenterById('0x0x0x-0x0x-0x0x');
    expect(result).toBeNull();
  });
});

describe('createOrUpdateMapCenter function', () => {
  it('should update the appropriate search_map_center instance if the entry type is search', async () => {
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
    // assert if result matches the expected map center object
    expect(result.map_center_id).toEqual(mockMapCenters[1].map_center_id);
    expect(result.search_map_center).toEqual(expect.objectContaining({
      latitude: updatedSearchMapCenter.latitude,
      longitude: updatedSearchMapCenter.longitude
    }));
  });

  it('should update the appropriate sell_map_center instance if the entry type is sell', async () => {
    const updatedSellMapCenter = {
      map_center_id: '0b0b0b-0b0b-0b0b',
      latitude: 42.8781,
      longitude: -88.6298
    };

    const result = await createOrUpdateMapCenter(
      '0b0b0b-0b0b-0b0b',
      updatedSellMapCenter.latitude,
      updatedSellMapCenter.longitude,
      'sell'
    ); 

    expect(result).toBeDefined();
    // assert if result matches the expected map center object
    expect(result.map_center_id).toEqual(mockMapCenters[1].map_center_id);
    expect(result.sell_map_center).toEqual(expect.objectContaining({
      latitude: updatedSellMapCenter.latitude,
      longitude: updatedSellMapCenter.longitude
    }));
  });
});
