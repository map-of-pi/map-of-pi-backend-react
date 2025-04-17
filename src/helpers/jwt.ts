import jwt from "jsonwebtoken";

import { IAdmin, IUser } from "../types";
import User from "../models/User";
import { env } from "../utils/env";

import logger from '../config/loggingConfig';
import Admin from "../models/Admin";

export const generateUserToken = (user: IUser) => {
  try {
    logger.info(`Generating token for user: ${user.pi_uid}`);
    const token = jwt.sign({ userId: user.pi_uid, _id: user._id }, env.JWT_SECRET, {
      expiresIn: "1d", // 1 day
    });
    logger.info(`Successfully generated token for user: ${user.pi_uid}`);
    return token;
  } catch (error) {
    logger.error(`Failed to generate user token for piUID ${ user.pi_uid }:`, error);
    throw new Error('Failed to generate user token; please try again');
  }
};
export const generateAdminToken = (admin: IAdmin) => {
  try {
    const token = jwt.sign({ userId: admin.id }, env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return token;
  } catch (error) {
    throw new Error('Failed to generate user token; please try again');
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
  } catch (error) {
    logger.error('Failed to decode user token:', error);
    throw new Error('Failed to decode user token; please try again');
  }
};
export const decodeAdminToken = async (token: string) => {
  try {
    logger.info(`Decoding token.`);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    if (!decoded.userId) {
      logger.warn(`Invalid token: Missing userID.`);
      throw new Error("Invalid token: Missing userID.");
    }
    logger.info(`Finding user associated with token: ${decoded.userId}`);
    const currentAdmin = await Admin.findById(decoded.userId);
    if (!currentAdmin) {
      logger.warn(`User not found for token: ${decoded.userId}`);
      throw new Error("User not found.");
    }
    return currentAdmin;
  } catch (error) {
    logger.error('Failed to decode user token:', error);
    throw new Error('Failed to decode user token; please try again');
  }
};
