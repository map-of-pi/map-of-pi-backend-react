import User from "../models/User";
import Seller from "../models/Seller";
import UserSettings from "../models/UserSettings";
import { ISeller, IUser, IUserSettings } from "../types";
import { getLocationByIP } from "./userSettings.service";
import logger from "../config/loggingConfig";

const getCoordinatesWithRetry = async (
  retries: number = 3,
  delay: number = 1000 // Delay in milliseconds
): Promise<{ lat: number; lng: number } | null> => {
  let attempt = 0;
  while (attempt < retries) {
    const coordinates = await getLocationByIP();
    if (coordinates) {
      return coordinates;
    }
    attempt++;
    logger.warn(`Retrying IP location fetch (${attempt}/${retries})...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  logger.warn('Failed to fetch IP coordinates after maximum retries');
  return null;
};

export const authenticate = async (currentUser: IUser): Promise<IUser> => {
  try {
    const user = await User.findOne({
      pi_uid: currentUser.pi_uid,
      pi_username: currentUser.pi_username
    }).setOptions({
      readPreference: 'primary'
    }).exec();

    if (user) {
      return user;
    } else {
      const newUser = await User.create({
        pi_uid: currentUser.pi_uid,
        pi_username: currentUser.pi_username,
        user_name: currentUser.user_name
      });
      const IP_coordinates = await getCoordinatesWithRetry(3, 1000);
      
      IP_coordinates ? 
        await UserSettings.create({
          user_settings_id: currentUser.pi_uid,
          user_name: currentUser.user_name,
          search_map_center: { type: 'Point', coordinates: [IP_coordinates.lng, IP_coordinates.lat] }
        }) : 
        await UserSettings.create({
          user_settings_id: currentUser.pi_uid,
          user_name: currentUser.user_name,
        })
      
      return newUser;
    }
  } catch (error: any) {
    logger.error(`Failed to authenticate user: ${ error.message }`);
    throw error;
  }
};

export const getUser = async (pi_uid: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ pi_uid }).exec();
    return user ? user as IUser : null;
  } catch (error: any) {
    logger.error(`Failed to retrieve user for piUID ${ pi_uid }: ${ error.message }`);
    throw error;
  }
};

export const deleteUser = async (pi_uid: string | undefined): Promise<{ user: IUser | null, sellers: ISeller[], userSetting: IUserSettings }> => {
  try {
    // delete any association with Seller
    const deletedSellers = await Seller.find({ seller_id: pi_uid }).exec();
    await Seller.deleteMany({ seller_id: pi_uid }).exec();

    // delete any association with User Settings
    const deletedUserSettings = await UserSettings.findOneAndDelete({ user_settings_id: pi_uid }).exec();

    // delete the user
    const deletedUser = await User.findOneAndDelete({ pi_uid }).exec();
    return {
      user: deletedUser ? deletedUser as IUser : null,
      sellers: deletedSellers as ISeller[],
      userSetting: deletedUserSettings as IUserSettings
    }
  } catch (error: any) {
    logger.error(`Failed to delete user or user association for piUID ${ pi_uid }: ${ error.message }`);
    throw error;
  }
};