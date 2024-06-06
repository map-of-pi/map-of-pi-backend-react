import mongoose, { Document, Schema, model, Types } from "mongoose";

export interface IUser extends Document {
  username: string;
  uid: string;
  balance: number;
  address?: Types.ObjectId;
  orders: Types.ObjectId[];
  role: Types.ObjectId[];
  permission: Types.ObjectId[];
  transactions: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShop extends Document {
  name: string;
  description: string;
  address: string;
  phone?: number;
  email?: string;
  online_orders_enabled: boolean;
  images: string[];
  products?: Types.ObjectId[];
  owner?: Types.ObjectId;
  reviews?: Types.ObjectId[];
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
  orders?: Types.ObjectId[];
}

export interface IReview extends Document {
  productId?: Types.ObjectId;
  message: string;
  rating?: number;
  reviewer?: Types.ObjectId;
}

interface ICoordinate {
  lat: number;
  lng: number;
}

export interface ISeller extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  image: string;
  coodinate: ICoordinate;
  address: string;
}

export interface IAuthResult {
  accessToken: string;
  user: {
    username: string;
    uid: string;
    roles: string[];
  };
}
