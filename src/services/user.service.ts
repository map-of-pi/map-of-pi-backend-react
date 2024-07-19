import User from "../models/User";
import { IUser } from "../types";

export const authenticate = async (currentUser: IUser): Promise<IUser> => {
  try {
    const user = await User.findOne({
      pi_uid: currentUser.pi_uid,
    }).exec();

    if (user) {
      return user;
    } else {
      const newUser = await User.create({
        pi_alias: currentUser.pi_alias,
        pi_uid: currentUser.pi_uid,
      });
      return newUser;
    }
  } catch (error: any) {
    console.log("Error during authentication", error.message);
    throw new Error(error);
  }
};

export const getUser = async (pi_alias: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ pi_alias }).exec();
    return user ? user as IUser : null;
  } catch (error: any) {
    console.error(`Error retrieving user with Pi alias ${pi_alias}:`, error.message);
    throw new Error(error.message);
  }
};
