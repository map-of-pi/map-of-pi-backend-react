import UserSettings from "../models/UserSettings";
import User from "../models/User";
import { IUser, IUserSettings } from "../types";

import logger from "../config/loggingConfig";

// Get device location, first trying GPS and then falling back to IP-based geolocation
export const getDeviceLocation = async (): Promise<{ lat: number; lng: number }> => {
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        })
      );
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (error) {
      console.warn("GPS location error:", (error as GeolocationPositionError).message);
      // Fall back to IP-based geolocation
    }
  }

  return getLocationByIP(); // Fallback to IP if GPS fails or is not supported
};

// Helper function to get location by IP address
const getLocationByIP = async (): Promise<{ lat: number; lng: number }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude };
    }
    throw new Error('Unable to retrieve location from IP address.');
  } catch (error: any) {
    throw new Error('Failed to retrieve location by IP: ' + error.message);
  }
};

// Function to check user search center and return appropriate location
export const userLocation = async (uid: string): Promise<{ lat: number; lng: number } | null> => {
  const userSettings = await UserSettings.findOne({ user_settings_id: uid }).exec();

  if (!userSettings) {
    console.warn("User settings not found");
    return null;
  }

  if (userSettings.findme === 'auto') {
    try {
      const location = await getDeviceLocation();
      console.log("User location from GPS/IP:", location);
      return location;
    } catch (error) {
      console.error("Failed to retrieve device location:", error);
      return null;
    }
  }

  if (userSettings.findme === 'searchCenter' && userSettings.search_map_center?.coordinates) {
    const searchCenter = userSettings.search_map_center.coordinates;
    const location = { lat: searchCenter[0], lng: searchCenter[1] }
    console.log("User location from search center:", location);
    return location as { lat: number; lng: number };
  }

  console.warn("Location not found");
  return null;
};


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