import User from "../models/User";
import { IUser } from "../types";

export const authenticate = async (currentUser: IUser): Promise<IUser> => {
  try {
    const user = await User.findOne({
      uid: currentUser.uid,
    }).exec();

    if (user) {
      return user;
    } else {
      const newUser = await User.create({
        username: currentUser.username,
        uid: currentUser.uid,
      });
      return newUser;
    }
  } catch (error: any) {
    console.log("Error during authentication", error.message);
    throw new Error(error);
  }
};

export const getUser = async (uid: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ uid }).exec();
    return user ? user as IUser : null;
  } catch (error: any) {
    console.error(`Error retrieving user with UID ${uid}:`, error.message);
    throw new Error(error.message);
  }
};
