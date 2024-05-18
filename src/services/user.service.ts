import User from "../models/User";
import { IAuthResult } from "../types";

export const authenticate = async (currentUser: IAuthResult) => {
  let user;
  let userExist: boolean = false;
  try {
    user = await User.findOne({ uid: currentUser.user.uid }).populate([
      "address",
      "orders",
      "role",
      "permission",
      "transactions",
    ]);

    if (user) {
      userExist = true;
      return { user, userExist };
    } else {
      userExist = false;
      user = await User.create({
        username: currentUser.user.username,
        uid: currentUser.user.uid,
      });
      return { user, userExist };
    }
  } catch (error: any) {
    console.log("error during authentication", error.message);
    throw new Error(error);
  }
};
