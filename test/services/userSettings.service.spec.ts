import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { addOrUpdateUserSettings } from '../../src/services/userSettings.service';
import User from '../../src/models/User';
import UserSettings from '../../src/models/UserSettings';
import { IUser, IUserSettings } from '../../src/types';

let mongoServer: MongoMemoryServer;

const mockUser = {
  pi_uid: '123-456-7890',
  pi_username: 'TestUser',
} as IUser;

const formData = {
  user_name: 'Test User',
  email: 'example-new@test.com',
  phone_number: '123-456-7890',
  image: 'http://example.com/image_new.jpg',
  findme: 'deviceGPS',
  search_map_center: JSON.stringify({ type: 'Point', coordinates: [-73.856077, 40.848447] })
};

const existingUserSettingsData: Partial<IUserSettings> = {
  user_settings_id: mockUser.pi_uid,
  user_name: 'Existing Test User',
  email: 'example-existing@test.com',
  phone_number: '987-654-3210',
  image: 'http://example.com/image-existing.jpg',
  findme: 'searchCenter',
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
  it('should add new user settings when user_name is not empty', async () => {
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
    expect(result).toHaveProperty('user_name', formData.user_name);
    expect(result).toHaveProperty('email', formData.email);
    expect(result).toHaveProperty('phone_number', formData.phone_number);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('findme', formData.findme);
    expect(result).toHaveProperty('search_map_center', formData.search_map_center);
  });

  it('should add new user settings when user_name is empty', async () => {
    jest.spyOn(UserSettings, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(null) // Return null to simulate no existing user settings
    } as any);
    
    const mockFindOneAndUpdate = jest.spyOn(User, 'findOneAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValue({user_name: mockUser.pi_username}) 
    } as any);

    // mock the save function to return the newly created user settings
    const mockSave = jest.fn().mockResolvedValue({
      ...formData,
      user_settings_id: mockUser.pi_uid,
      user_name: mockUser.pi_username
    })

    jest.spyOn(UserSettings.prototype, 'save').mockImplementation(mockSave);

    const result = await addOrUpdateUserSettings(mockUser, { ...formData, user_name: ""}, formData.image);
    
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { pi_uid: mockUser.pi_uid },
      { user_name: mockUser.pi_username },
      { new: true }
    );

    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid); 
    expect(result).toHaveProperty('user_name', mockUser.pi_username);
    expect(result).toHaveProperty('email', formData.email);
    expect(result).toHaveProperty('phone_number', formData.phone_number);
    expect(result).toHaveProperty('image', formData.image);
    expect(result).toHaveProperty('findme', formData.findme);
    expect(result).toHaveProperty('search_map_center', formData.search_map_center);
  });

  it('should update existing user settings', async () => {
    jest.spyOn(UserSettings, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingUserSettingsData)
    } as any);

    const updatedUserSettingsData = {
      ...existingUserSettingsData,
      user_name: formData.user_name,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      findme: formData.findme,
      search_map_center: formData.search_map_center
    };

    jest.spyOn(UserSettings, 'findOneAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedUserSettingsData)
    } as any);

    const result = await addOrUpdateUserSettings(mockUser, updatedUserSettingsData, updatedUserSettingsData.image);

    expect(result).toHaveProperty('user_settings_id', mockUser.pi_uid);
    expect(result).toHaveProperty('user_name', updatedUserSettingsData.user_name);
    expect(result).toHaveProperty('email', updatedUserSettingsData.email);
    expect(result).toHaveProperty('phone_number', updatedUserSettingsData.phone_number);
    expect(result).toHaveProperty('image', updatedUserSettingsData.image);
    expect(result).toHaveProperty('findme', updatedUserSettingsData.findme);
    expect(result).toHaveProperty('search_map_center', updatedUserSettingsData.search_map_center);
  });
});
