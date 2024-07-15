import User from "../models/User";
import { IUser } from "../types";

export const authenticate = async (currentUser: IUser): Promise<IUser> => {
  
  try {
    const user = await User.findOne({
      username: currentUser.username,
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
