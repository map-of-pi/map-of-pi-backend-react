import UserSettings from "../models/UserSettings";
import User from "../models/User";
import { IUser, IUserSettings } from "../types";

import logger from "../config/loggingConfig";

export const getUserSettingsById = async (user_settings_id: string): Promise<IUserSettings | null> => {
  try {
    const userSettings = await UserSettings.findOne({ user_settings_id }).exec();
    return userSettings;
  } catch (error: any) {
    logger.error(`Error retrieving user settings for userID ${user_settings_id}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const addOrUpdateUserSettings = async (
  authUser: IUser, 
  formData: any, 
  image: string
): Promise<IUserSettings> => {
  try {
    if (formData.user_name.trim() === "") {
      formData.user_name = authUser.pi_username;

      await User.findOneAndUpdate(
        { pi_uid: authUser.pi_uid },
        { user_name: formData.user_name },
        { new: true }
      ).exec();
    }

    let existingUserSettings = await UserSettings.findOne({
      user_settings_id: authUser.pi_uid
    }).exec();

    // parse search_map_center from String into JSON object.
    const searchMapCenter = formData.search_map_center 
      ? JSON.parse(formData.search_map_center)
      : { type: 'Point', coordinates: [0, 0] };

    // construct user settings object
    const userSettingsData: Partial<IUserSettings> = {
      user_settings_id: authUser.pi_uid,
      user_name: formData.user_name || '',
      email: formData.email || existingUserSettings?.email || '',
      phone_number: formData.phone_number || existingUserSettings?.phone_number || '',
      image: image || existingUserSettings?.image || '',
      search_map_center: searchMapCenter || existingUserSettings?.search_map_center || { type: 'Point', coordinates: [0, 0] }
    };    

    if (existingUserSettings) {
      const updatedUserSettings = await UserSettings.findOneAndUpdate(
        { user_settings_id: authUser.pi_uid },
        { $set: userSettingsData }, // Include the potentially updated user_name
        { new: true }
      ).exec();

      return updatedUserSettings as IUserSettings;

    } else {
      // If no existing user settings, create new ones
      const newUserSettings = new UserSettings({
        ...userSettingsData,
        user_settings_id: authUser.pi_uid,
        trust_meter_rating: 100,
      });

      const savedUserSettings = await newUserSettings.save();
      return savedUserSettings as IUserSettings;
    }
  } catch (error: any) {
    logger.error(`Error adding or updating user settings: ${error.message}`);
    throw new Error(error.message);
  }
};

// Delete existing user settings
export const deleteUserSettings = async (user_settings_id: string): Promise<IUserSettings | null> => {
  try {
    const deletedUserSettings = await UserSettings.findOneAndDelete({ user_settings_id: user_settings_id }).exec();
    return deletedUserSettings ? deletedUserSettings as IUserSettings : null;
  } catch (error: any) {
    logger.error(`Error deleting user settings with userSettingsID ${user_settings_id}: ${error.message}`);
    throw new Error(error.message);
  }
};
