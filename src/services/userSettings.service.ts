import UserSettings from "../models/UserSettings";
import { IUser, IUserSettings } from "../types";

import logger from "../config/loggingConfig";
import User from "../models/User";

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
  userSettingsData: IUserSettings,
  authUser: IUser
): Promise<IUserSettings> => {
  try {
    // Update the user_name if it's empty
    if (userSettingsData.user_name.trim() === "") {
      userSettingsData.user_name = authUser.pi_username;
    }

    // Update User document with the correct username if necessary
    await User.findOneAndUpdate(
      { pi_uid: authUser.pi_uid },
      { user_name: userSettingsData.user_name },
      { new: true }
    ).exec();

    let userSettings = await UserSettings.findOne({
      user_settings_id: authUser.pi_uid
    }).exec();

    // If user settings already exist, update them
    if (userSettings) {      
      const updatedUserSettings = await UserSettings.findOneAndUpdate(
        { user_settings_id: authUser.pi_uid },
        { ...userSettingsData }, // Include the potentially updated user_name
        { new: true }
      ).exec();

      return updatedUserSettings as IUserSettings;

    } else {
      // If no existing user settings, create new ones
      const newUserSettings = new UserSettings({
        ...userSettingsData,
        user_settings_id: authUser.pi_uid,
      });

      const savedUserSettings = await newUserSettings.save();
      return savedUserSettings as IUserSettings;
    }

  } catch (error: any) {
    logger.error(`Error registering user settings: ${error.message}`);
    throw new Error(error.message);
  }
};

export const updateUserSettings = async (user_settings_id: string, userSettingsData: Partial<IUserSettings>): Promise<IUserSettings | null> => {
  try {
    const updatedUserSettings = await UserSettings.findOneAndUpdate({ user_settings_id }, userSettingsData, { new: true }).exec();
    return updatedUserSettings;
  } catch (error: any) {
    logger.error(`Error updating user settings for user ID ${user_settings_id}: ${error.message}`);
    throw new Error(error.message);
  }
};
