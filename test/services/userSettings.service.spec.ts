import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { addOrUpdateUserSettings } from '../../src/services/userSettings.service';
import User from '../../src/models/User';
import UserSettings from '../../src/models/UserSettings';
import { DeviceLocationType } from '../../src/models/enums/deviceLocationType';
import { IUser, IUserSettings } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUser = {
  pi_uid: '0a0a0a-0a0a-0a0a',
  pi_username: 'TestUser1',
  user_name: 'test-user-1'
} as IUser;

const mockUserSettings = {
  user_settings_id: '0a0a0a-0a0a-0a0a',
  user_name: 'test-user-1',
  email: 'example-existing@test.com',
  phone_number: '987-654-3210',
  image: 'http://example.com/image-existing.jpg',
  findme: DeviceLocationType.SearchCenter,
  search_map_center: { type: 'Point', coordinates: [-83.856077, 50.848447] }
} as IUserSettings;

const formData = {
  user_name: 'test-user-1-updated',
  email: 'example-new@test.com',
  phone_number: '123-456-7890',
  image: 'http://example.com/image_new.jpg',
  findme: DeviceLocationType.GPS,
  search_map_center: { type: 'Point', coordinates: [-83.856077, 50.848447] }
}

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });

    // initialize in-memory MongoDB by inserting mock data records
    await User.create(mockUser);
    await UserSettings.create(mockUserSettings);
  } catch (error) {
    console.error('Failed to start MongoMemoryServer', error);
    throw error;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('addOrUpdateUserSettings function', () => {
  it('should add new user settings when user_name is not empty', async () => {
    const result = await addOrUpdateUserSettings(mockUser, formData, formData.image ?? '');
    
    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid); 
    expect(result).toHaveProperty('user_name', formData.user_name);
    expect(result).toHaveProperty('email', formData.email);
    expect(result).toHaveProperty('phone_number', formData.phone_number);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('findme', formData.findme);
    expect(result).toHaveProperty('search_map_center', formData.search_map_center);
  });

  it('should add new user settings when user_name is empty', async () => {
    const result = await addOrUpdateUserSettings(
    mockUser, { 
      ...formData, user_name: ""
    } as IUserSettings, formData.image ?? '');

    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid); 
    expect(result).toHaveProperty('user_name', mockUser.pi_username);
    expect(result).toHaveProperty('email', formData.email);
    expect(result).toHaveProperty('phone_number', formData.phone_number);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('findme', formData.findme);
    expect(result).toHaveProperty('search_map_center', formData.search_map_center);
  });

  it('should update existing user settings', async () => {
    const updatedUserSettingsData = {
      ...mockUserSettings,
      user_name: formData.user_name,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      findme: formData.findme,
      search_map_center: formData.search_map_center
    } as IUserSettings;

    const result = await addOrUpdateUserSettings(mockUser, updatedUserSettingsData, updatedUserSettingsData.image ?? '');

    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid);
    expect(result).toHaveProperty('user_name', updatedUserSettingsData.user_name);
    expect(result).toHaveProperty('email', updatedUserSettingsData.email);
    expect(result).toHaveProperty('phone_number', updatedUserSettingsData.phone_number);
    expect(result).toHaveProperty('image', updatedUserSettingsData.image);
    expect(result).toHaveProperty('findme', updatedUserSettingsData.findme);
    expect(result).toHaveProperty('search_map_center', updatedUserSettingsData.search_map_center);
  });
});
