import Seller from '../../src/models/Seller';
import UserSettings from '../../src/models/UserSettings';
import { getMapCenterById, createOrUpdateMapCenter } from '../../src/services/mapCenter.service';

describe('getMapCenterById function', () => {
  it('should fetch the sell map center for the given seller ID', async () => {
    const sellerData = await Seller.findOne({ seller_id: '0a0a0a-0a0a-0a0a' });

    const result = await getMapCenterById('0a0a0a-0a0a-0a0a', 'sell');

    expect(result).toBeDefined();
    // assert that the result matches the expected sell map center
    expect(result).toEqual(expect.objectContaining(sellerData!.sell_map_center));
  });

  it('should fetch the search map center for the given user settings ID', async () => {
    const userSettingsData = await UserSettings.findOne({ user_settings_id: '0b0b0b-0b0b-0b0b' });

    const result = await getMapCenterById('0b0b0b-0b0b-0b0b', 'search');

    expect(result).toBeDefined();
    // assert that the result matches the expected search map center
    expect(result).toEqual(expect.objectContaining(userSettingsData!.search_map_center));
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
