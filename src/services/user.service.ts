import User from "../models/User";
import { IAuthResult } from "../types";

export const authenticate = async (currentUser: IAuthResult) => {
  try {
    const user = await User.findOne({
      username: currentUser.user.username,
    });

    if (user) {
      return user;
    } else {
      const newUser = await User.create({
        username: currentUser.user.username,
        uid: currentUser.user.uid,
      });
      return newUser;
    }
  } catch (error: any) {
    console.log("Error during authentication", error.message);
    throw new Error(error);
  }
};
