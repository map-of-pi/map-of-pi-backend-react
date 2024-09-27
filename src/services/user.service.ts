import User from "../models/User";
import Seller from "../models/Seller";
import UserSettings from "../models/UserSettings";
import { ISeller, IUser, IUserSettings } from "../types";

import logger from "../config/loggingConfig";

export const authenticate = async (currentUser: IUser): Promise<IUser> => {
  try {
    const user = await User.findOne({
      pi_uid: currentUser.pi_uid,
      pi_username: currentUser.pi_username
    }).exec();

    if (user) {
      return user;
    //  TODO: Revisit and review this implementation; seems contrary to authentication.
    } else {
      const newUser = await User.create({
        pi_uid: currentUser.pi_uid,
        pi_username: currentUser.pi_username,
        user_name: currentUser.user_name
      });
      const uerSettings = await UserSettings.create({
        user_settings_id: currentUser.pi_uid
      })
      
      return newUser;
    }
  } catch (error: any) {
    logger.error('Failed to authenticate user:', { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed during user authentication; please try again later');
  }
};

export const getUser = async (pi_uid: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ pi_uid }).exec();
    return user ? user as IUser : null;
  } catch (error: any) {
    logger.error(`Failed to retrieve user for piUID ${ pi_uid }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to retrieve user; please try again later');
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
    logger.error(`Failed to delete user or user association for piUID ${ pi_uid }:`, { 
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    throw new Error('Failed to delete user or user association; please try again later');
  }
};
