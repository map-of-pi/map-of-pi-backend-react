import { addOrUpdateUserSettings } from '../../src/services/userSettings.service';
import User from '../../src/models/User';
import { DeviceLocationType } from '../../src/models/enums/deviceLocationType';
import { IUser, IUserSettings } from '../../src/types';

const formData = {
  user_name: 'test-user-1-updated',
  email: 'example-new@test.com',
  phone_number: '123-456-7890',
  image: 'http://example.com/image_new.jpg',
  findme: DeviceLocationType.GPS,
  search_map_center: { type: 'Point', coordinates: [-83.856077, 50.848447] }
}

describe('addOrUpdateUserSettings function', () => {
  it('should add new user settings when user_name is not empty', async () => {
    const mockUser = await User.findOne({ pi_username: 'TestUser1' }) as IUser;

    const result = await addOrUpdateUserSettings(mockUser, formData, formData.image ?? '');
    
    expect(result).toEqual(expect.objectContaining({
      user_settings_id: mockUser.pi_uid,
      user_name: formData.user_name,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      findme: formData.findme,
      search_map_center: formData.search_map_center
    }));
  });

  it('should add new user settings when user_name is empty', async () => {
    const mockUser = await User.findOne({ pi_username: 'TestUser1' }) as IUser;

    const result = await addOrUpdateUserSettings(
    mockUser, { 
      ...formData, user_name: ""
    } as IUserSettings, formData.image ?? '');

    expect(result).toEqual(expect.objectContaining({
      user_settings_id: mockUser.pi_uid,
      user_name: mockUser.pi_username,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      findme: formData.findme,
      search_map_center: formData.search_map_center
    }));
  });

  it('should update existing user settings', async () => {
    const mockUser = await User.findOne({ pi_username: 'TestUser1' }) as IUser;

    const updatedUserSettingsData = {
      user_name: formData.user_name,
      email: formData.email,
      phone_number: formData.phone_number,
      image: formData.image,
      findme: formData.findme,
      search_map_center: formData.search_map_center
    } as IUserSettings;

    const result = await addOrUpdateUserSettings(mockUser, updatedUserSettingsData, updatedUserSettingsData.image ?? '');

    expect(result).toEqual(expect.objectContaining({
      user_settings_id: mockUser.pi_uid,
      user_name: updatedUserSettingsData.user_name,
      email: updatedUserSettingsData.email,
      phone_number: updatedUserSettingsData.phone_number,
      image: updatedUserSettingsData.image,
      findme: updatedUserSettingsData.findme,
      search_map_center: updatedUserSettingsData.search_map_center
    }));
  });
});
