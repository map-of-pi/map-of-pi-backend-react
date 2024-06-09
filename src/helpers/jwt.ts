import jwt from "jsonwebtoken";

import { IUser, IUser_ } from "../types";
import { env } from "../utils/env";
import User from "../models/User_";

// import User from "../models/User";

export const generateUserToken = (user: IUser_) => {
  try {
    const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
      expiresIn: "30d",
    });
    return token;
  } catch (error: any) {
    console.error("Error generating user token:", error);
    throw new Error(error.message);
  }
};

export const decodeUserToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    if (!decoded.userId) {
      throw new Error("Invalid token: Missing userID");
    }
    const associatedUser = await User.findById(decoded.userId);
    if (!associatedUser) {
      throw new Error("User not found");
    }
    return associatedUser;
  } catch (error: any) {
    console.error("Error decoding user token:", error);
    throw new Error(error.message);
  }
};
