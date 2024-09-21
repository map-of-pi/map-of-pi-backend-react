import jwt from "jsonwebtoken";

import { IUser } from "../types";
import User from "../models/User";
import { env } from "../utils/env";

import logger from '../config/loggingConfig';

export const generateUserToken = (user: IUser) => {
  try {
    logger.info(`Generating token for user: ${user.pi_uid}`);
    const token = jwt.sign({ userId: user.pi_uid, _id: user._id }, env.JWT_SECRET, {
      expiresIn: "1d", // 1 day
    });
    logger.info(`Successfully generated token for user: ${user.pi_uid}`);
    return token;
  } catch (error: any) {
    logger.error(`Error generating user token for user ${user.pi_uid}: ${error.message}`);
    throw new Error(error.message);
  }
};

export const decodeUserToken = async (token: string) => {
  try {
    logger.info(`Decoding token.`);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    if (!decoded.userId) {
      logger.warn(`Invalid token: Missing userID.`);
      throw new Error("Invalid token: Missing userID.");
    }
    logger.info(`Finding user associated with token: ${decoded.userId}`);
    const associatedUser = await User.findOne({pi_uid: decoded.userId});
    if (!associatedUser) {
      logger.warn(`User not found for token: ${decoded.userId}`);
      throw new Error("User not found.");
    }
    logger.info(`Successfully decoded token and found user: ${associatedUser.pi_uid}`);
    return associatedUser;
  } catch (error: any) {
    logger.error(`Error decoding user token: ${error.message}`);
    throw new Error(error.message);
  }
};
