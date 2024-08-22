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
    } else {
      const newUser = await User.create({
        pi_uid: currentUser.pi_uid,
        pi_username: currentUser.pi_username,
        user_name: currentUser.user_name
      });
      return newUser;
    }
  } catch (error: any) {
    logger.error(`Error during authentication: ${error.message}`);
    throw new Error(error.message);
  }
};

export const getUser = async (pi_uid: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ pi_uid }).exec();
    return user ? user as IUser : null;
  } catch (error: any) {
    logger.error(`Error retrieving user with Pi alias ${pi_uid}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const deleteUser = async (pi_uid: string): Promise<{ user: IUser | null, sellers: ISeller[], userSetting: IUserSettings }> => {
  try {
    // delete any association with Seller
    const deletedSellers = await Seller.find({ pi_uid }).exec();
    await Seller.deleteMany({ pi_uid }).exec();

    // delete any association with User Settings
    const deletedUserSettings = await UserSettings.findOneAndDelete({ pi_uid }).exec();

    // delete the user
    const deletedUser = await User.findOneAndDelete({ pi_uid }).exec();
    return {
      user: deletedUser ? deletedUser as IUser : null,
      sellers: deletedSellers as ISeller[],
      userSetting: deletedUserSettings as IUserSettings
    }
  } catch (error: any) {
    logger.error(`Error deleting user and/ or user associations with userID ${pi_uid}: ${error.message}`);
    throw new Error(error.message);
  }
};
