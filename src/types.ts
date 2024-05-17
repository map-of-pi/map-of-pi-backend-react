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

export interface IRole extends Document {
  name: string;
}
export interface IPermission extends Document {
  name: string;
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

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  images: string[];
  discount: number;
  deliveryMethod?: Types.ObjectId;
  category?: Types.ObjectId;
  shop?: Types.ObjectId;
  reviews?: Types.ObjectId[];
  rating?: number;
  stock: number;
}

export interface IOrder extends Document {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  userId: Types.ObjectId;
  sellerId: Types.ObjectId;
}
export interface IReview extends Document {
  productId?: Types.ObjectId;
  message: string;
  rating?: number;
  reviewer?: Types.ObjectId;
}
export interface IUserProfile extends Document {
  email: number;
  profile: string;
  phone: number;
  nickname: string;
  country: string;
  region: string;
  city: string;
}

export interface ICart extends Document {
  owner?: Types.ObjectId;
  totalPrice: number;
  items: Types.ObjectId[];
}

export interface ICartItem extends Document {
  product?: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IPayment extends Document {
  amount: number;
  piTransactionId: string;
  user?: Types.ObjectId;
}

export interface PaymentDTO {
  amount: number;
  user_uid: string;
  created_at: string;
  identifier: string;
  metadata: Object;
  memo: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  to_address: string;
  transaction: null | {
    txid: string;
    verified: boolean;
    _link: string;
  };
}

export interface ICategory extends Document {
  name: string;
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

export interface IShippingMethod extends Document {
  name: string;
}

export interface IAuthResult {
  accessToken: string;
  user: {
    username: string;
    uid: string;
    roles: string[];
  };
}
