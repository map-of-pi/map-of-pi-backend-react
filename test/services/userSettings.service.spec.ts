import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { addOrUpdateUserSettings } from '../../src/services/userSettings.service';
import UserSettings from '../../src/models/UserSettings';
import { IUser, IUserSettings } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUser = {
  pi_uid: '123-456-7890',
  user_name: 'TestUser',
} as IUser;

const formData = {
  email: 'example-new@test.com',
  phone_number: '123-456-7890',
  image: 'http://example.com/image_new.jpg',
  search_map_center: JSON.stringify({ type: 'Point', coordinates: [-73.856077, 40.848447] })
};

const existingUserSettingsData: Partial<IUserSettings> = {
  user_settings_id: mockUser.pi_uid,
  email: 'example-existing@test.com',
  phone_number: '987-654-3210',
  image: 'http://example.com/image-existing.jpg',
  search_map_center: { type: 'Point', coordinates: [-83.856077, 50.848447] }
};

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'test' });
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
  it('should add new user settings', async () => {
    jest.spyOn(UserSettings, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(null) // Return null to simulate no existing user settings
    } as any);

    // mock the save function to return the newly created user settings
    const mockSave = jest.fn().mockResolvedValue({
      ...formData,
      user_settings_id: mockUser.pi_uid
    })
    jest.spyOn(UserSettings.prototype, 'save').mockImplementation(mockSave);

    const result = await addOrUpdateUserSettings(mockUser, formData, formData.image);
    
    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid);
    expect(result).toHaveProperty('email', formData.email);
    expect(result).toHaveProperty('phone_number', formData.phone_number);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('search_map_center', formData.search_map_center);
  });

  it('should update existing user settings', async () => {
    jest.spyOn(UserSettings, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingUserSettingsData)
    } as any);

    const updatedUserSettingsData = {
      ...existingUserSettingsData,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      search_map_center: formData.search_map_center
    };

    jest.spyOn(UserSettings, 'findOneAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedUserSettingsData)
    } as any);

    const result = await addOrUpdateUserSettings(mockUser, updatedUserSettingsData, updatedUserSettingsData.image);

    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid);
    expect(result).toHaveProperty('email', updatedUserSettingsData.email);
    expect(result).toHaveProperty('phone_number', updatedUserSettingsData.phone_number);
    expect(result).toHaveProperty('image', updatedUserSettingsData.image);
    expect(result).toHaveProperty('search_map_center', updatedUserSettingsData.search_map_center);
  });
});
