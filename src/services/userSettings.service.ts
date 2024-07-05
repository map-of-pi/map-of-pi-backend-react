import UserSettings from "../models/UserSettings";
import { IUserSettings } from "../types";

export const getUserSettingsById = async (user_settings_id: string): Promise<IUserSettings | null> => {
  try {
    const userSettings = await UserSettings.findOne({ user_settings_id }).exec();
    return userSettings;
  } catch (error: any) {
    console.error(`Error retrieving user settings for userID ${user_settings_id}: `, error.message);
    throw new Error(error.message);
  }
};

export const addUserSettings = async (userSettingsData: IUserSettings): Promise<IUserSettings> => {
  try {
    const newUserSettings = new UserSettings(userSettingsData);
    const savedUserSettings = await newUserSettings.save();
    return savedUserSettings;
  } catch (error: any) {
    console.error("Error registering new user settings: ", error.message);
    throw new Error(error.message);
  }
};

export const updateUserSettings = async (user_settings_id: string, userSettingsData: Partial<IUserSettings>): Promise<IUserSettings | null> => {
  try {
    const updatedUserSettings = await UserSettings.findOneAndUpdate({ user_settings_id }, userSettingsData, { new: true }).exec();
    return updatedUserSettings;
  } catch (error: any) {
    console.error(`Error updating user settings for user ID ${user_settings_id}: `, error.message);
    throw new Error(error.message);
  }
};
