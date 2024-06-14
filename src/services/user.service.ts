import User from "../models/User";
import { IUser } from "../types";

export const authenticate = async (currentUser: IUser) => {
  try {
    const user = await User.findOne({
      username: currentUser.user_name,
    });

    if (user) {
      return user;
    } else {
      const newUser = await User.create({
        username: currentUser.user_name,
        user_id: currentUser.user_id,
      });
      return newUser;
    }
  } catch (error: any) {
    console.log("Error during authentication", error.message);
    throw new Error(error);
  }
};
